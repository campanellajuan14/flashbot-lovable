
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
    try {
      // Clone request to read body multiple times
      const reqClone = req.clone();
      const rawBody = await req.text();
      
      // Verify Meta signature if APP_SECRET is configured
      if (metaAppSecret) {
        const signature = req.headers.get('x-hub-signature-256') || '';
        
        if (!signature) {
          console.warn("Request without signature (x-hub-signature-256)");
          // Continue processing even without signature for testing
        } else {
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
      }

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
                console.log(`Processing message: ${JSON.stringify(message)}`);
                
                // Only process text messages
                if (message.type === 'text' && message.text) {
                  await processIncomingMessage(
                    supabase, 
                    phoneNumberId,
                    message,
                    value.contacts?.find(c => c.wa_id === message.from)?.profile.name || 'Usuario'
                  );
                } else {
                  console.log(`Skipping non-text message of type: ${message.type}`);
                }
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
      .select('user_id, active_chatbot_id, is_active, secret_id')
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

    console.log(`Message content: "${messageContent}", type: ${messageType}`);
    
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

    console.log("Message saved successfully:", savedMessage ? savedMessage[0]?.id : "unknown");
    
    // Only process text messages
    if (messageType === 'text') {
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
      console.log(`Using conversation ID: ${conversationId}`);
      
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
      
      console.log(`Retrieved chatbot behavior: ${JSON.stringify(chatbot?.behavior || {})}`);
      
      // Generate chatbot response using Claude or GPT
      console.log("Generating chatbot response...");
      
      let response = null;
      try {
        // Log important parameters for debugging
        console.log(`Calling claude-chat with chatbotId=${configData.active_chatbot_id}, conversationId=${conversationId}`);
        console.log(`Using model: ${chatbot?.settings?.model || 'gpt-4o'}`);
        
        response = await generateChatbotResponse(supabase, configData.active_chatbot_id, conversationId, messageContent, chatbot);
        
        if (!response) {
          console.log("No response from claude-chat, using fallback message");
          response = "Lo siento, estoy teniendo problemas para generar una respuesta. Por favor, inténtelo de nuevo más tarde.";
        }
      } catch (responseError) {
        console.error("Error generating response:", responseError);
        // Provide fallback response
        response = "Lo siento, estamos experimentando dificultades técnicas. Por favor, inténtelo de nuevo más tarde.";
      }
      
      console.log(`Generated response: "${response?.substring(0, 50)}..."`);
      
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
      
      // Get API token - IMPROVED TOKEN RETRIEVAL LOGIC
      let apiToken = await getWhatsAppToken(supabase, configData.secret_id);
      if (!apiToken) {
        console.error("Could not retrieve API token using any method");
        return;
      }
      
      // Intentamos primero con mensaje de texto regular (más sencillo y confiable)
      try {
        console.log("Preparing to send WhatsApp text message...");
        console.log(`Response content: ${response?.substring(0, 100)}...`);
        
        const textPayload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: message.from,
          type: 'text',
          text: {
            preview_url: true,
            body: response
          }
        };
        
        console.log("Sending text payload:", JSON.stringify(textPayload));
        
        const textResponse = await fetch(
          `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, 
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(textPayload)
          }
        );
        
        const textResponseData = await textResponse.json();
        console.log("WhatsApp text response:", JSON.stringify(textResponseData));
        
        if (!textResponse.ok) {
          // Si el mensaje de texto falla, podría ser porque estamos fuera de la ventana de 24h
          // Intentamos con plantilla como último recurso
          throw new Error(`Text message failed: ${JSON.stringify(textResponseData)}`);
        }
        
        // Text message sent successfully
        console.log("Text message sent successfully");
        
        // Log sent message
        await supabase.from('whatsapp_messages').insert({
          user_id: configData.user_id,
          phone_number_id: phoneNumberId,
          wa_message_id: textResponseData.messages?.[0]?.id,
          conversation_id: conversationId,
          chatbot_id: configData.active_chatbot_id,
          from_number: phoneNumberId,
          to_number: message.from,
          message_type: 'text',
          message_content: response,
          direction: 'outbound',
          status: 'sent',
          timestamp: new Date().toISOString(),
          metadata: textResponseData
        });
        
      } catch (textError) {
        // Text message failed, try with template
        console.log("Text message error:", textError.message);
        console.log("Trying to send as template message...");
        
        try {
          // Let's look for any template that might be available
          console.log("Getting available templates...");
          let templateName = "hello_world"; // Default fallback template name
          let languageCode = "es";          // Default language
          
          // Query API for available templates
          try {
            const templatesResponse = await fetch(
              `https://graph.facebook.com/v18.0/${phoneNumberId}/message_templates?fields=name,status,language&limit=10`, 
              {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${apiToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            if (templatesResponse.ok) {
              const templatesData = await templatesResponse.json();
              console.log("Available templates:", JSON.stringify(templatesData));
              
              // Find first APPROVED template
              if (templatesData.data && templatesData.data.length > 0) {
                const approvedTemplate = templatesData.data.find(t => t.status === 'APPROVED');
                if (approvedTemplate) {
                  templateName = approvedTemplate.name;
                  languageCode = approvedTemplate.language || 'es';
                  console.log(`Using approved template: ${templateName} (${languageCode})`);
                }
              }
            } else {
              console.error("Error getting templates, using default");
            }
          } catch (templatesError) {
            console.error("Error fetching templates:", templatesError);
          }
          
          // Send with template
          const templatePayload = {
            messaging_product: 'whatsapp',
            to: message.from,
            type: 'template',
            template: {
              name: templateName,
              language: {
                code: languageCode
              },
              components: [
                {
                  type: 'body',
                  parameters: [
                    {
                      type: 'text',
                      text: "Gracias por tu mensaje. Un agente se pondrá en contacto contigo pronto."
                    }
                  ]
                }
              ]
            }
          };
          
          console.log("Sending template payload:", JSON.stringify(templatePayload));
          
          const templateResponse = await fetch(
            `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, 
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(templatePayload)
            }
          );
          
          const templateResponseData = await templateResponse.json();
          console.log("WhatsApp template response:", JSON.stringify(templateResponseData));
          
          if (!templateResponse.ok) {
            throw new Error(`Template message failed: ${JSON.stringify(templateResponseData)}`);
          }
          
          // Template message sent successfully
          console.log("Template message sent successfully as fallback");
          
          // Log sent message
          await supabase.from('whatsapp_messages').insert({
            user_id: configData.user_id,
            phone_number_id: phoneNumberId,
            wa_message_id: templateResponseData.messages?.[0]?.id,
            conversation_id: conversationId,
            chatbot_id: configData.active_chatbot_id,
            from_number: phoneNumberId,
            to_number: message.from,
            message_type: 'template',
            message_content: "Mensaje de plantilla (fallback)",
            direction: 'outbound',
            status: 'sent',
            timestamp: new Date().toISOString(),
            metadata: templateResponseData
          });
          
        } catch (templateError) {
          console.error("All message sending methods failed:", templateError.message);
          console.error("Could not respond to the user's message");
        }
      }
    }
  } catch (error) {
    console.error("Error processing message:", error);
  }
}

// IMPROVED: More robust token retrieval function that tries multiple methods
async function getWhatsAppToken(supabase: any, secretId: string): Promise<string | null> {
  console.log(`Attempting to retrieve WhatsApp token for secret ID: ${secretId}`);
  let token = null;

  try {
    // Method 1: Try to get from Vault first (if available)
    if (supabase.vault && typeof supabase.vault.decrypt === 'function') {
      try {
        console.log("Attempting to retrieve token from Vault...");
        const { data, error } = await supabase.vault.decrypt(secretId);
        
        if (!error && data) {
          console.log("Successfully retrieved API token from Vault");
          return data;
        } else {
          console.error("Failed to retrieve token from Vault:", error);
        }
      } catch (vaultError) {
        console.error("Vault access error:", vaultError);
      }
    } else {
      console.log("Vault not available, skipping Vault token retrieval");
    }
    
    // Method 2: Try to get directly from user_whatsapp_tokens table
    try {
      console.log("Attempting to retrieve token from user_whatsapp_tokens table...");
      const { data: tokenData, error: tokenError } = await supabase
        .from('user_whatsapp_tokens')
        .select('encrypted_token')
        .eq('id', secretId)
        .single();
        
      if (!tokenError && tokenData && tokenData.encrypted_token) {
        console.log("Successfully retrieved API token from user_whatsapp_tokens table");
        return tokenData.encrypted_token;
      } else {
        console.error("Error retrieving token from user_whatsapp_tokens table:", tokenError);
      }
    } catch (dbError) {
      console.error("Database access error:", dbError);
    }
    
    // Method 3: Fallback - try direct query from user_whatsapp_config table
    try {
      console.log("Attempting to retrieve token from secret_data in user_whatsapp_config...");
      const { data: configData, error: configError } = await supabase
        .from('user_whatsapp_config')
        .select('secret_data')
        .eq('secret_id', secretId)
        .single();
        
      if (!configError && configData && configData.secret_data) {
        console.log("Successfully retrieved API token from user_whatsapp_config");
        return configData.secret_data;
      } else {
        console.error("Error retrieving token from user_whatsapp_config:", configError);
      }
    } catch (backupError) {
      console.error("Backup token retrieval error:", backupError);
    }
    
    // All methods failed
    console.error("All token retrieval methods failed");
    return null;
    
  } catch (error) {
    console.error("Error in getWhatsAppToken:", error);
    return null;
  }
}

async function findOrCreateConversation(
  supabase: any,
  chatbotId: string,
  userIdentifier: string,
  userName: string
) {
  console.log(`Finding/creating conversation for chatbot ${chatbotId} and user ${userIdentifier}`);
  
  try {
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
      console.log(`Found existing conversation: ${data[0].id}`);
      return { data: data[0], error: null };
    }
    
    // If not found or error, create new conversation
    console.log("Creating new conversation");
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
  } catch (error) {
    console.error("Error in findOrCreateConversation:", error);
    return { data: null, error };
  }
}

async function generateChatbotResponse(
  supabase: any,
  chatbotId: string,
  conversationId: string,
  userMessage: string,
  chatbot: any
) {
  console.log(`Generating response for chatbot ${chatbotId}, conversation ${conversationId}`);
  
  try {
    // Determine which model to use based on chatbot configuration
    const model = chatbot?.settings?.model || 'gpt-4o';
    const isAnthropic = model.includes('claude');
    
    console.log(`Using model: ${model}, isAnthropic: ${isAnthropic}`);
    
    // Prepare system message including behavior settings
    const systemMessage = `${chatbot.behavior?.tone || 'You are a professional and friendly assistant.'} ${chatbot.behavior?.instructions || ''}`;
    console.log(`System message: "${systemMessage.substring(0, 100)}..."`);
    
    // Invoke appropriate function based on model
    const functionName = 'claude-chat'; // Use the same edge function for both models
    
    // Prepare messages for the chat
    const messages = [
      // System message
      {
        role: 'system',
        content: systemMessage
      },
      // User message
      { 
        role: 'user', 
        content: userMessage 
      }
    ];
    
    console.log(`Invoking edge function: ${functionName} with payload:`, JSON.stringify({
      messages: messages,
      model: model,
      chatbotId: chatbotId,
      conversationId: conversationId,
      source: 'whatsapp-webhook'
    }, null, 2));
    
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: {
        messages: messages,
        chatbotId: chatbotId,
        conversationId: conversationId,
        source: 'whatsapp-webhook',
        settings: chatbot.settings
      },
    });
    
    if (error) {
      console.error("Error invoking edge function:", error);
      throw error;
    }
    
    console.log("Claude-chat function response:", JSON.stringify(data));
    
    if (!data || !data.message) {
      console.error("No response data returned from function");
      return "Lo siento, tuve un problema procesando tu mensaje. Por favor, intenta de nuevo más tarde.";
    }
    
    console.log(`Response generated successfully with length: ${data.message.length || 0}`);
    console.log(`Response preview: ${data.message.substring(0, 100) || "No response"}`);
    
    return data.message;
  } catch (error) {
    console.error("Error generating response:", error);
    return "Lo siento, tuve un problema procesando tu mensaje. Por favor, intenta de nuevo más tarde.";
  }
}

async function processMessageStatus(supabase: any, phoneNumberId: string, status: any) {
  try {
    console.log(`Processing message status update: ${JSON.stringify(status)}`);
    
    // Update message status in database
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .update({
        status: status.status,
        timestamp: new Date(parseInt(status.timestamp) * 1000).toISOString()
      })
      .eq('wa_message_id', status.id)
      .eq('phone_number_id', phoneNumberId)
      .select();
    
    if (error) {
      console.error("Error updating message status:", error);
    } else {
      console.log(`Updated status for message: ${data?.length > 0 ? data[0].id : 'unknown'}`);
    }
  } catch (error) {
    console.error("Error processing message status:", error);
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

