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
      
      let response: string = "";
      try {
        // Log important parameters for debugging
        console.log(`Calling claude-chat with chatbotId=${configData.active_chatbot_id}, conversationId=${conversationId}`);
        console.log(`Using model: ${chatbot?.settings?.model || 'gpt-4o'}`);
        
        const generatedResponse = await generateChatbotResponse(supabase, configData.active_chatbot_id, conversationId, messageContent, chatbot);
        
        if (!generatedResponse) {
          console.log("No response from claude-chat, using fallback message");
          response = "Lo siento, estoy teniendo problemas para generar una respuesta. Por favor, inténtelo de nuevo más tarde.";
        } else {
          response = generatedResponse;
        }
      } catch (responseError) {
        console.error("Error generating response:", responseError);
        // Provide fallback response
        response = "Lo siento, estamos experimentando dificultades técnicas. Por favor, inténtelo de nuevo más tarde.";
      }
      
      console.log(`Generated response: "${response.substring(0, 50)}..."`);
      
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
  // Limitar longitud del mensaje para evitar problemas
  const MAX_MESSAGE_LENGTH = 1000;
  if (response.length > MAX_MESSAGE_LENGTH) {
    console.log(`Truncando respuesta larga de ${response.length} a ${MAX_MESSAGE_LENGTH} caracteres`);
    response = response.substring(0, MAX_MESSAGE_LENGTH) + "...";
  }

  // Verificar y formatear el número de teléfono correctamente
  let formattedNumber = recipientNumber;
  if (!formattedNumber.match(/^\d+$/)) {
    // Si hay caracteres no numéricos, limpiarlos
    formattedNumber = formattedNumber.replace(/\D/g, '');
    console.log(`Número limpiado de caracteres no numéricos: ${formattedNumber}`);
  }
  
  // Asegurarse de que el número tenga formato internacional
  if (!formattedNumber.match(/^[1-9]\d{10,14}$/)) {
    // Si no tiene el formato internacional correcto, podría ser un problema
    console.warn(`⚠️ ADVERTENCIA: El número ${formattedNumber} no parece tener formato internacional estándar`);
  }

  console.log(`📱 Enviando a número: ${formattedNumber}`);
  console.log(`🔑 Token (primeros 10 chars): ${apiToken.substring(0, 10)}...`);
  console.log(`📞 Phone Number ID: ${phoneNumberId}`);

  // Intentamos primero con mensaje de texto regular (más sencillo y confiable)
  try {
    console.log("📤 Enviando mensaje de texto directo a WhatsApp...");
    console.log(`📋 Contenido: "${response.substring(0, 50)}${response.length > 50 ? '...' : ''}"`);
    
    const textPayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedNumber,
      type: 'text',
      text: {
        preview_url: true,
        body: response
      }
    };
    
    console.log("📦 Payload completo:", JSON.stringify(textPayload, null, 2));
    
    // Incluir timeout para evitar bloqueos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
    
    try {
      // Sending directly to the WhatsApp API
      const textResponse = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, 
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(textPayload),
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      // Capturar respuesta como texto para mejor análisis
      const textResponseText = await textResponse.text();
      console.log("📥 Respuesta cruda de WhatsApp:", textResponseText);
      
      // Intentar convertir a JSON si es posible
      let textResponseData;
      try {
        textResponseData = JSON.parse(textResponseText);
        console.log("🔍 Respuesta como JSON:", JSON.stringify(textResponseData, null, 2));
      } catch (jsonError) {
        console.error("❌ Error al analizar respuesta JSON:", jsonError);
        textResponseData = { error: "Invalid JSON response", raw: textResponseText };
      }
      
      // Verificar errores específicos de WhatsApp
      if (!textResponse.ok) {
        const errorCode = textResponseData?.error?.code;
        const errorMessage = textResponseData?.error?.message || "Unknown error";
        
        console.error(`❌ Error al enviar mensaje (${textResponse.status}): Código ${errorCode}, Mensaje: ${errorMessage}`);
        
        // Identificar errores específicos
        if (errorCode === 100) {
          console.error("⚠️ Error de parámetros: Verifica el formato del número y payload");
        } else if (errorCode === 131047 || errorCode === 131051) {
          console.error("⚠️ Fuera de la ventana de 24h, se requiere plantilla");
        } else if (errorCode === 131026) {
          console.error("⚠️ El número no está registrado en WhatsApp");
        } else if (errorCode === 190) {
          console.error("⚠️ Token inválido o expirado");
        }
        
        throw new Error(`WhatsApp API error ${errorCode}: ${errorMessage}`);
      }
      
      // Mensaje enviado con éxito
      console.log("✅ Mensaje de texto enviado correctamente");
      
      // Registrar mensaje enviado
      await supabase.from('whatsapp_messages').insert({
        user_id: configData.user_id,
        phone_number_id: phoneNumberId,
        wa_message_id: textResponseData.messages?.[0]?.id,
        conversation_id: conversationId,
        chatbot_id: configData.active_chatbot_id,
        from_number: phoneNumberId,
        to_number: formattedNumber,
        message_type: 'text',
        message_content: response,
        direction: 'outbound',
        status: 'sent',
        timestamp: new Date().toISOString(),
        metadata: textResponseData
      });
      
      console.log("📝 Mensaje registrado en base de datos");
      return true;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error("⏱️ Timeout al enviar mensaje (10s)");
        throw new Error("WhatsApp API request timed out");
      }
      throw fetchError;
    }
    
  } catch (textError) {
    // Text message failed, try with template
    console.log("❌ Error enviando mensaje de texto:", textError.message);
    return await sendTemplateMessage(supabase, apiToken, phoneNumberId, formattedNumber, conversationId, configData);
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
  console.log("🔄 Intentando enviar mensajes con plantilla...");
  
  try {
    // Buscar plantillas disponibles
    console.log("🔍 Obteniendo plantillas disponibles...");
    let templateName = "hello_world"; // Plantilla por defecto
    let languageCode = "es";          // Idioma por defecto
    
    // Consultar API para obtener plantillas
    try {
      console.log("📞 Llamando a la API para obtener plantillas...");
      const templatesResponse = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/message_templates?fields=name,status,language&limit=20`, 
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const templatesText = await templatesResponse.text();
      console.log("📄 Respuesta de plantillas (raw):", templatesText);
      
      let templatesData;
      try {
        templatesData = JSON.parse(templatesText);
        console.log("📋 Plantillas disponibles:", JSON.stringify(templatesData, null, 2));
        
        // Encontrar una plantilla APROBADA
        if (templatesData.data && templatesData.data.length > 0) {
          console.log(`🔢 Se encontraron ${templatesData.data.length} plantillas`);
          
          // Listar todas las plantillas para diagnóstico
          templatesData.data.forEach((template: any, index: number) => {
            console.log(`📑 Plantilla ${index+1}: ${template.name} - Estado: ${template.status} - Idioma: ${template.language || 'desconocido'}`);
          });
          
          const approvedTemplate = templatesData.data.find((t: any) => t.status === 'APPROVED');
          if (approvedTemplate) {
            templateName = approvedTemplate.name;
            languageCode = approvedTemplate.language || 'es';
            console.log(`✅ Usando plantilla aprobada: ${templateName} (${languageCode})`);
          } else {
            console.warn("⚠️ No se encontraron plantillas APROBADAS, usando la primera disponible");
            templateName = templatesData.data[0].name;
            languageCode = templatesData.data[0].language || 'es';
          }
        } else {
          console.warn("⚠️ No se encontraron plantillas, usando valores por defecto");
        }
      } catch (parseError) {
        console.error("❌ Error al analizar respuesta de plantillas:", parseError);
      }
    } catch (templatesError) {
      console.error("❌ Error al obtener plantillas:", templatesError);
      console.log("⚠️ Continuando con plantilla por defecto");
    }
    
    // Enviar con plantilla
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
    
    console.log("📦 Enviando payload de plantilla:", JSON.stringify(templatePayload, null, 2));
    
    // Llamada directa a la API de WhatsApp
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
    
    const templateResponseText = await templateResponse.text();
    console.log("📥 Respuesta cruda de plantilla:", templateResponseText);
    
    let templateResponseData;
    try {
      templateResponseData = JSON.parse(templateResponseText);
      console.log("🔍 Respuesta de plantilla como JSON:", JSON.stringify(templateResponseData, null, 2));
    } catch (jsonError) {
      console.error("❌ Error al analizar respuesta JSON de plantilla:", jsonError);
      templateResponseData = { error: "Invalid JSON response", raw: templateResponseText };
    }
    
    if (!templateResponse.ok) {
      const errorCode = templateResponseData?.error?.code;
      const errorMessage = templateResponseData?.error?.message || "Unknown error";
      
      console.error(`❌ Error al enviar plantilla (${templateResponse.status}): Código ${errorCode}, Mensaje: ${errorMessage}`);
      
      throw new Error(`Template message failed: ${errorMessage}`);
    }
    
    // Plantilla enviada con éxito
    console.log("✅ Mensaje de plantilla enviado con éxito como alternativa");
    
    // Registrar mensaje enviado
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
    
    console.log("📝 Mensaje de plantilla registrado en base de datos");
    return true;
    
  } catch (templateError) {
    console.error("❌ Todos los métodos de envío fallaron:", templateError.message);
    console.error("⛔ No se pudo responder al mensaje del usuario");
    return false;
  }
}
