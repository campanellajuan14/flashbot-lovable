
/**
 * Procesar mensaje entrante de WhatsApp y enviar respuesta del chatbot
 */
export async function processIncomingMessage(
  supabase: any,
  phoneNumberId: string,
  message: any,
  senderName: string
) {
  try {
    console.log(`📱 Procesando mensaje de WhatsApp: ${message.from} (${senderName})`);
    console.log(`📬 Contenido del mensaje: "${message.text?.body || '<no-text>'}", tipo: ${message.type}`);
    
    // Importar los módulos necesarios
    const { findOrCreateConversation } = await import("../utils/conversation.ts");
    const { generateChatbotResponse } = await import("./responseGenerator.ts");
    const { getWhatsAppToken, verifyWhatsAppToken } = await import("../utils/tokenRetrieval.ts");
    const { getWhatsAppConfig, getChatbotInfo } = await import("./configHandler.ts");
    const { 
      saveInboundMessage, 
      saveConversationMessage, 
      sendWhatsAppResponse, 
      sendWhatsAppTemplate,
      saveOutboundMessage 
    } = await import("./messageSender.ts");
    
    // Obtener la configuración para este número de teléfono
    const { config, error: configError } = await getWhatsAppConfig(supabase, phoneNumberId);
    
    if (configError || !config) {
      console.error(`❌ Error obteniendo config: ${configError || 'No encontrada'}`);
      return { success: false, error: configError || 'Config error' };
    }
    
    // Buscar o crear conversación
    const { data: conversation, error: conversationError } = await findOrCreateConversation(
      supabase,
      config.active_chatbot_id,
      message.from,
      senderName
    );
    
    if (conversationError || !conversation) {
      console.error(`❌ Error al crear conversación: ${conversationError?.message || 'Unknown error'}`);
      return { success: false, error: 'Failed to create conversation' };
    }
    
    console.log(`💬 Conversación: ${conversation.id}`);
    
    // Comprobamos el tipo de mensaje y procesamos
    if (message.type !== 'text' || !message.text) {
      console.log(`⚠️ Tipo de mensaje no soportado: ${message.type}. Enviando respuesta genérica.`);
      
      // Recuperar token
      const token = await getWhatsAppToken(supabase, config.secret_id);
      
      if (!token) {
        console.error(`❌ No se pudo recuperar el token de WhatsApp`);
        return { success: false, error: 'WhatsApp token not available' };
      }

      try {
        // Enviar respuesta informando que ese tipo de mensaje no es soportado
        const response = "Lo siento, por el momento solo puedo procesar mensajes de texto.";
        
        await sendWhatsAppResponse(
          supabase,
          phoneNumberId,
          message.from,
          response,
          token
        );
        
        return { success: true, message_id: 'unsupported-type-response' };
      } catch (typeError) {
        console.error(`❌ Error enviando respuesta para tipo no soportado: ${typeError.message}`);
        return { success: false, error: typeError.message };
      }
    }
    
    // Guardar mensaje entrante en la base de datos
    await saveInboundMessage(
      supabase,
      config.user_id,
      phoneNumberId,
      config.active_chatbot_id,
      conversation.id,
      message
    );
    
    // Obtener información del chatbot para generar respuesta
    const { chatbot, error: chatbotError } = await getChatbotInfo(supabase, config.active_chatbot_id);
    
    if (chatbotError || !chatbot) {
      console.error(`❌ Error obteniendo chatbot: ${chatbotError || 'Not found'}`);
      return { success: false, error: chatbotError || 'Chatbot error' };
    }
    
    // También guardar mensaje en la tabla de mensajes genérica para el historial completo
    await saveConversationMessage(
      supabase,
      conversation.id,
      'user',
      message.text.body
    );
    
    // Generar respuesta con el chatbot
    try {
      console.log(`🧠 Generando respuesta con chatbot ${chatbot.name} para "${message.text.body.substring(0, 50)}..."`);
      
      const response = await generateChatbotResponse(
        supabase,
        config.active_chatbot_id,
        conversation.id,
        message.text.body,
        chatbot
      );
      
      console.log(`✅ Respuesta generada: "${response.substring(0, 50)}..."`);
      
      // Guardar la respuesta en la tabla de mensajes
      await saveConversationMessage(
        supabase,
        conversation.id,
        'assistant',
        response
      );
      
      // Recuperar token para enviar respuesta
      console.log(`🔑 Recuperando token de WhatsApp para secret_id: ${config.secret_id}`);
      const token = await getWhatsAppToken(supabase, config.secret_id);
      
      if (!token) {
        throw new Error("No se pudo obtener un token válido de WhatsApp");
      }
      
      console.log(`✅ Token recuperado correctamente`);
      
      // Verificar validez del token antes de usarlo
      const isTokenValid = await verifyWhatsAppToken(token, phoneNumberId);
      
      if (!isTokenValid) {
        console.error(`❌ El token de WhatsApp no es válido o ha expirado`);
        throw new Error("El token de WhatsApp no es válido o ha expirado. Por favor, actualiza el token en la configuración de WhatsApp.");
      }
      
      // Enviar respuesta a WhatsApp
      let responseData;
      
      try {
        // Intento de envío con texto regular
        console.log(`📤 Enviando mensaje de texto a WhatsApp`);
        const result = await sendWhatsAppResponse(
          supabase,
          phoneNumberId,
          message.from,
          response,
          token
        );
        responseData = result.data;
      } catch (textError) {
        console.error(`❌ Error enviando mensaje de texto: ${textError.message}`);
        console.log(`🔄 Intentando enviar como plantilla "hello_world" como fallback...`);
        
        // Si falla el envío de texto, intentar con una plantilla genérica
        try {
          const templateResult = await sendWhatsAppTemplate(
            supabase,
            phoneNumberId,
            message.from,
            "hello_world",
            "es_ES",
            [],
            token
          );
          responseData = templateResult.data;
          console.log(`✅ Plantilla enviada como fallback`);
        } catch (templateError) {
          console.error(`❌ También falló el envío de la plantilla: ${templateError.message}`);
          throw new Error(`No se pudo enviar la respuesta: ${textError.message}`);
        }
      }
      
      // Guardar mensaje enviado en la base de datos
      await saveOutboundMessage(
        supabase,
        config.user_id,
        phoneNumberId,
        config.active_chatbot_id,
        conversation.id,
        phoneNumberId,
        message.from,
        response,
        responseData
      );
      
      return {
        success: true,
        message_id: responseData.messages?.[0]?.id
      };
    } catch (error) {
      console.error(`❌ Error procesando mensaje o enviando respuesta: ${error.message}`, error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    console.error(`❌ Error general procesando mensaje: ${error.message}`, error);
    return { success: false, error: error.message };
  }
}
