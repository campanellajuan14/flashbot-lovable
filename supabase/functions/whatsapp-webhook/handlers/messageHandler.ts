
import { findOrCreateConversation } from "../utils/conversation.ts";
import { getWhatsAppToken } from "../utils/tokenRetrieval.ts";
import { generateChatbotResponse } from "./responseGenerator.ts";

/**
 * Process an incoming message from WhatsApp
 */
export async function processIncomingMessage(
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
      
      // Get API token
      let apiToken = await getWhatsAppToken(supabase, configData.secret_id);
      if (!apiToken) {
        console.error("Could not retrieve API token using any method");
        return;
      }
      
      await sendWhatsAppResponse(supabase, apiToken, phoneNumberId, message.from, response, conversationId, configData);
    }
  } catch (error) {
    console.error("Error processing message:", error);
  }
}

/**
 * Send a response back to the user via WhatsApp API
 */
async function sendWhatsAppResponse(
  supabase: any,
  apiToken: string,
  phoneNumberId: string,
  recipientNumber: string,
  response: string,
  conversationId: string,
  configData: any
) {
  // Intentamos primero con mensaje de texto regular (más sencillo y confiable)
  try {
    console.log("Preparing to send WhatsApp text message...");
    console.log(`Response content: ${response?.substring(0, 100)}...`);
    
    const textPayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientNumber,
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
      to_number: recipientNumber,
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
    await sendTemplateMessage(supabase, apiToken, phoneNumberId, recipientNumber, conversationId, configData);
  }
}

/**
 * Send a template message as fallback when text messages fail
 */
async function sendTemplateMessage(
  supabase: any,
  apiToken: string,
  phoneNumberId: string,
  recipientNumber: string,
  conversationId: string,
  configData: any
) {
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
          const approvedTemplate = templatesData.data.find((t: any) => t.status === 'APPROVED');
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
      to: recipientNumber,
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
      to_number: recipientNumber,
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
