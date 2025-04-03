
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import * as crypto from "https://deno.land/std@0.177.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface WebhookMessage {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: {
            body: string;
          };
          type: string;
          [key: string]: unknown;
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

serve(async (req: Request) => {
  // Get environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const metaAppSecret = Deno.env.get('META_APP_SECRET') || '';
  
  // Create Supabase client with service role
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log("Starting whatsapp-webhook function");

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle webhook verification (GET request)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const challenge = url.searchParams.get('hub.challenge');
    const verifyToken = url.searchParams.get('hub.verify_token');
    const phoneNumberId = url.searchParams.get('phone_number_id');

    console.log(`Verification request received: mode=${mode}, token=${verifyToken}, phone=${phoneNumberId}`);

    if (!phoneNumberId) {
      return new Response(
        JSON.stringify({ error: "phone_number_id parameter is required" }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Find WhatsApp configuration by phone_number_id
    const { data: configData, error: configError } = await supabase
      .from('user_whatsapp_config')
      .select('id, user_id, webhook_verify_token')
      .eq('phone_number_id', phoneNumberId)
      .single();

    if (configError || !configData) {
      console.error(`Error finding configuration for ${phoneNumberId}:`, configError);
      return new Response(
        JSON.stringify({ error: "No configuration found for this phone_number_id" }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Verify token
    if (mode === 'subscribe' && verifyToken === configData.webhook_verify_token) {
      console.log(`Verification successful for phone_number_id ${phoneNumberId}`);
      
      // Update verification status
      await supabase
        .from('user_whatsapp_config')
        .update({ webhook_verified: true })
        .eq('id', configData.id);

      // Respond with challenge to complete verification
      return new Response(challenge || '', 
        { status: 200, headers: { 'Content-Type': 'text/plain', ...corsHeaders } }
      );
    } else {
      console.error(`Verification failed: incorrect token for ${phoneNumberId}`);
      return new Response(
        JSON.stringify({ error: "Verification failed: incorrect token" }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  }
  
  // Handle event notifications (POST request)
  else if (req.method === 'POST') {
    // Clone request to read body multiple times
    const reqClone = req.clone();
    const rawBody = await req.text();
    
    // Verify Meta signature if APP_SECRET is configured
    if (metaAppSecret) {
      const signature = req.headers.get('x-hub-signature-256') || '';
      
      if (!signature) {
        console.warn("Request without signature (x-hub-signature-256)");
        return new Response(
          JSON.stringify({ error: "Meta signature required" }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      // Verify signature
      const isValid = await verifySignature(rawBody, signature, metaAppSecret);
      
      if (!isValid) {
        console.error("Invalid signature. Possible unauthorized request.");
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    }

    try {
      const data = JSON.parse(rawBody) as WebhookMessage;
      console.log("Webhook payload received:", JSON.stringify(data));
      
      // Verify it's a WhatsApp notification
      if (data.object !== 'whatsapp_business_account') {
        return new Response(
          JSON.stringify({ error: "Unsupported event type" }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Process each entry
      for (const entry of data.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            const value = change.value;
            const phoneNumberId = value.metadata.phone_number_id;
            
            // Process incoming messages
            if (value.messages && value.messages.length > 0) {
              for (const message of value.messages) {
                await processIncomingMessage(
                  supabase, 
                  phoneNumberId,
                  message,
                  value.contacts?.find(c => c.wa_id === message.from)?.profile.name || 'Unknown'
                );
              }
            }
            
            // Process message status updates
            if (value.statuses && value.statuses.length > 0) {
              for (const status of value.statuses) {
                await processMessageStatus(supabase, phoneNumberId, status);
              }
            }
          }
        }
      }

      // Respond quickly to avoid retries
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    } catch (error) {
      console.error("Error processing webhook:", error);
      return new Response(
        JSON.stringify({ error: "Error processing payload", details: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  } else {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});

async function processIncomingMessage(
  supabase: any,
  phoneNumberId: string,
  message: any,
  senderName: string
) {
  console.log(`Processing incoming message from ${message.from} for ${phoneNumberId}`);
  
  try {
    // Find user configuration for this phone_number_id
    const { data: configData, error: configError } = await supabase
      .from('user_whatsapp_config')
      .select('user_id, active_chatbot_id, is_active')
      .eq('phone_number_id', phoneNumberId)
      .single();
      
    if (configError || !configData) {
      console.error(`No configuration found for ${phoneNumberId}:`, configError);
      return;
    }
    
    // Check if WhatsApp is active for this user
    if (!configData.is_active) {
      console.log(`WhatsApp disabled for phone_number_id ${phoneNumberId}`);
      return;
    }
    
    // Check if an active chatbot is configured
    if (!configData.active_chatbot_id) {
      console.log(`No active chatbot for phone_number_id ${phoneNumberId}`);
      return;
    }
    
    // Extract message content
    let messageContent = '';
    let messageType = message.type;
    
    if (message.text) {
      messageContent = message.text.body;
    } else if (message.image) {
      messageContent = '[Image]';
    } else if (message.audio) {
      messageContent = '[Audio]';
    } else if (message.video) {
      messageContent = '[Video]';
    } else if (message.document) {
      messageContent = '[Document]';
    } else {
      messageContent = '[Unsupported message]';
      messageType = 'unsupported';
    }
    
    // Log received message
    const { data: savedMessage, error: saveError } = await supabase
      .from('whatsapp_messages')
      .insert({
        user_id: configData.user_id,
        phone_number_id: phoneNumberId,
        chatbot_id: configData.active_chatbot_id,
        wa_message_id: message.id,
        from_number: message.from,
        to_number: phoneNumberId,
        message_type: messageType,
        message_content: messageContent,
        direction: 'inbound',
        timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
        metadata: {
          sender_name: senderName,
          raw_message: message
        }
      })
      .select();
    
    if (saveError) {
      console.error("Error saving incoming message:", saveError);
      return;
    }
    
    // Only process text messages
    if (message.type === 'text') {
      // Find or create conversation for this sender
      const { data: convData, error: convError } = await findOrCreateConversation(
        supabase,
        configData.active_chatbot_id,
        message.from,
        senderName
      );
      
      if (convError) {
        console.error("Error creating/finding conversation:", convError);
        return;
      }
      
      const conversationId = convData.id;
      
      // Log user message in conversations table
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: messageContent,
          role: 'user',
          metadata: {
            source: 'whatsapp',
            phone: message.from,
            name: senderName
          }
        });
      
      // Update WhatsApp message with associated conversation
      await supabase
        .from('whatsapp_messages')
        .update({ conversation_id: conversationId })
        .eq('id', savedMessage[0].id);
      
      // Get chatbot data
      const { data: chatbot, error: chatbotError } = await supabase
        .from('chatbots')
        .select('behavior, settings')
        .eq('id', configData.active_chatbot_id)
        .single();
      
      if (chatbotError) {
        console.error("Error getting chatbot data:", chatbotError);
        return;
      }
      
      // Generate chatbot response using Claude or GPT
      const response = await generateChatbotResponse(
        supabase,
        configData.active_chatbot_id,
        conversationId,
        messageContent,
        chatbot
      );
      
      if (!response) {
        console.error("Could not generate response");
        return;
      }
      
      // Log assistant response in conversations table
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: response,
          role: 'assistant',
          metadata: {
            source: 'whatsapp'
          }
        });
      
      // Send response to WhatsApp
      await sendWhatsAppResponse(
        supabase,
        phoneNumberId,
        configData.user_id, 
        message.from,
        response
      );
    }
  } catch (error) {
    console.error("Error processing message:", error);
  }
}

async function findOrCreateConversation(
  supabase: any,
  chatbotId: string,
  userIdentifier: string,
  userName: string
) {
  // Try to find existing conversation for this number and chatbot
  const { data, error } = await supabase
    .from('conversations')
    .select()
    .eq('chatbot_id', chatbotId)
    .eq('user_identifier', userIdentifier)
    .order('created_at', { ascending: false })
    .limit(1);
  
  // If found, return the conversation
  if (!error && data && data.length > 0) {
    return { data: data[0], error: null };
  }
  
  // If not found or error, create new conversation
  return await supabase
    .from('conversations')
    .insert({
      chatbot_id: chatbotId,
      user_identifier: userIdentifier,
      metadata: {
        source: 'whatsapp',
        name: userName
      }
    })
    .select()
    .single();
}

async function generateChatbotResponse(
  supabase: any,
  chatbotId: string,
  conversationId: string,
  userMessage: string,
  chatbot: any
) {
  try {
    // Determine which model to use based on chatbot configuration
    const model = chatbot?.settings?.model || 'gpt-4o';
    const isAnthropic = model.includes('claude');
    
    // Invoke appropriate function based on model
    if (isAnthropic) {
      const { data, error } = await supabase.functions.invoke('claude-chat', {
        body: {
          messages: [
            // System
            {
              role: 'system',
              content: `${chatbot.behavior.tone || 'You are a professional and friendly assistant.'} ${chatbot.behavior.instructions || ''}`
            },
            // User
            { role: 'user', content: userMessage }
          ],
          model: model,
          chatbotId: chatbotId,
          conversationId: conversationId
        },
      });
      
      if (error) throw error;
      return data.response;
    } else {
      // Call to OpenAI (similar structure to Claude for simplicity)
      const { data, error } = await supabase.functions.invoke('claude-chat', {
        body: {
          messages: [
            // System
            {
              role: 'system',
              content: `${chatbot.behavior.tone || 'You are a professional and friendly assistant.'} ${chatbot.behavior.instructions || ''}`
            },
            // User
            { role: 'user', content: userMessage }
          ],
          model: 'gpt-4o',
          chatbotId: chatbotId,
          conversationId: conversationId
        },
      });
      
      if (error) throw error;
      return data.response;
    }
  } catch (error) {
    console.error("Error generating response:", error);
    return null;
  }
}

async function sendWhatsAppResponse(
  supabase: any,
  phoneNumberId: string,
  userId: string,
  recipientPhone: string,
  message: string
) {
  try {
    // Get WhatsApp configuration
    const { data: configData, error: configError } = await supabase
      .from('user_whatsapp_config')
      .select('secret_id')
      .eq('phone_number_id', phoneNumberId)
      .single();
    
    if (configError) {
      console.error("Error getting configuration:", configError);
      return null;
    }
    
    // Get API token from vault
    const { data: secretData, error: secretError } = await supabase.vault.decrypt(configData.secret_id);
    
    if (secretError) {
      console.error("Error getting secret:", secretError);
      return null;
    }
    
    const apiToken = secretData.secret;
    
    // Send message to WhatsApp
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, 
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipientPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: message
          }
        })
      }
    );
    
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error("Error sending message:", responseData);
      return null;
    }
    
    // Log sent message
    await supabase
      .from('whatsapp_messages')
      .insert({
        user_id: userId,
        phone_number_id: phoneNumberId,
        wa_message_id: responseData.messages?.[0]?.id,
        from_number: phoneNumberId,
        to_number: recipientPhone,
        message_type: 'text',
        message_content: message,
        direction: 'outbound',
        status: 'sent',
        metadata: responseData
      });
    
    return responseData;
  } catch (error) {
    console.error("Error sending response:", error);
    return null;
  }
}

async function processMessageStatus(supabase: any, phoneNumberId: string, status: any) {
  try {
    // Update message status in database
    await supabase
      .from('whatsapp_messages')
      .update({
        status: status.status,
        timestamp: new Date(parseInt(status.timestamp) * 1000).toISOString()
      })
      .eq('wa_message_id', status.id)
      .eq('phone_number_id', phoneNumberId);
    
  } catch (error) {
    console.error("Error updating message status:", error);
  }
}

async function verifySignature(payload: string, signature: string, appSecret: string): Promise<boolean> {
  try {
    const signatureParts = signature.split('=');
    if (signatureParts.length !== 2) return false;
    
    const algorithm = signatureParts[0];
    const expectedSignature = signatureParts[1];
    
    if (algorithm !== 'sha256') return false;
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(appSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
    
    const actualSignature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );
    
    // Convert ArrayBuffer to hex string
    const hashArray = Array.from(new Uint8Array(actualSignature));
    const actualHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return actualHex === expectedSignature;
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}
