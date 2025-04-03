
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
    console.log(`📬 Contenido del mensaje: "${message.text.body}"`);
    
    // Importar los módulos necesarios
    const { findOrCreateConversation } = await import("../utils/conversation.ts");
    const { generateChatbotResponse } = await import("./responseGenerator.ts");
    const { getWhatsAppToken } = await import("../utils/tokenRetrieval.ts");
    const { getWhatsAppConfig, getChatbotInfo } = await import("./configHandler.ts");
    const { 
      saveInboundMessage, 
      saveConversationMessage, 
      sendWhatsAppResponse, 
      saveOutboundMessage 
    } = await import("./messageSender.ts");
    
    // Obtener la configuración para este número de teléfono
    const { config, error: configError } = await getWhatsAppConfig(supabase, phoneNumberId);
    
    if (configError || !config) {
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
      
      // Recuperar token para enviar respuesta usando la función mejorada
      console.log(`🔑 Recuperando token de WhatsApp para secret_id: ${config.secret_id}`);
      const token = await getWhatsAppToken(supabase, config.secret_id);
      
      if (!token) {
        throw new Error("No se pudo obtener un token válido de WhatsApp");
      }
      
      console.log(`✅ Token recuperado correctamente`);
      
      // Enviar respuesta a WhatsApp
      const { data: responseData } = await sendWhatsAppResponse(
        supabase,
        phoneNumberId,
        message.from,
        response,
        token
      );
      
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
