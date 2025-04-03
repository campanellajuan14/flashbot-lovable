
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
    
    // Obtener la configuración para este número de teléfono
    const { data: config, error: configError } = await supabase
      .from('user_whatsapp_config')
      .select('user_id, active_chatbot_id, is_active, secret_id')
      .eq('phone_number_id', phoneNumberId)
      .single();
      
    if (configError || !config) {
      console.error(`❌ Error obteniendo configuración de WhatsApp: ${configError?.message || 'No encontrada'}`);
      return { success: false, error: 'Config not found' };
    }
    
    // Verificar si WhatsApp está activo
    if (!config.is_active) {
      console.log(`⚠️ WhatsApp está desactivado para este número: ${phoneNumberId}`);
      return { success: false, error: 'WhatsApp integration is disabled' };
    }
    
    // Verificar si hay un chatbot activo
    if (!config.active_chatbot_id) {
      console.error(`❌ No hay chatbot configurado para este número: ${phoneNumberId}`);
      return { success: false, error: 'No active chatbot configured' };
    }
    
    console.log(`✅ Configuración correcta - Chatbot ID: ${config.active_chatbot_id}`);
    
    // Importar los módulos necesarios
    const { findOrCreateConversation } = await import("../utils/conversation.ts");
    const { generateChatbotResponse } = await import("./responseGenerator.ts");
    const { getWhatsAppToken } = await import("../utils/tokenRetrieval.ts");
    
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
    const { error: messageError } = await supabase
      .from('whatsapp_messages')
      .insert({
        user_id: config.user_id,
        phone_number_id: phoneNumberId,
        chatbot_id: config.active_chatbot_id,
        conversation_id: conversation.id,
        wa_message_id: message.id,
        from_number: message.from,
        to_number: phoneNumberId,
        message_type: 'text',
        message_content: message.text.body,
        direction: 'inbound',
        timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
        metadata: {
          sender_name: senderName,
          wa_message: message
        }
      });
      
    if (messageError) {
      console.error(`❌ Error guardando mensaje entrante: ${messageError.message}`);
    }
    
    // Obtener información del chatbot para generar respuesta
    const { data: chatbot, error: chatbotError } = await supabase
      .from('chatbots')
      .select('id, name, behavior, settings')
      .eq('id', config.active_chatbot_id)
      .single();
      
    if (chatbotError || !chatbot) {
      console.error(`❌ Error obteniendo detalles del chatbot: ${chatbotError?.message || 'Not found'}`);
      return { success: false, error: 'Chatbot not found' };
    }
    
    console.log(`🤖 Chatbot encontrado: ${chatbot.name}`);
    
    // También guardar mensaje en la tabla de mensajes genérica para el historial completo
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        role: 'user',
        content: message.text.body
      });
    
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
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          role: 'assistant',
          content: response
        });
      
      // Recuperar token para enviar respuesta usando la función mejorada
      console.log(`🔑 Recuperando token de WhatsApp para secret_id: ${config.secret_id}`);
      const token = await getWhatsAppToken(supabase, config.secret_id);
      
      if (!token) {
        throw new Error("No se pudo obtener un token válido de WhatsApp");
      }
      
      console.log(`✅ Token recuperado correctamente`);
      
      // Enviar respuesta a WhatsApp
      console.log(`📤 Enviando respuesta a WhatsApp para ${message.from}`);
      const whatsappResponse = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: message.from,
          type: "text",
          text: {
            preview_url: false,
            body: response
          }
        })
      });
      
      if (!whatsappResponse.ok) {
        const errorData = await whatsappResponse.text();
        console.error(`❌ Error enviando respuesta a WhatsApp: ${whatsappResponse.status} ${errorData}`);
        
        // Información detallada para depuración
        try {
          const errorJson = JSON.parse(errorData);
          console.error(`❌ Detalles del error: ${JSON.stringify(errorJson)}`);
          
          // Si es un error de token inválido, podríamos intentar regenerar/refrescar el token en una implementación futura
          if (whatsappResponse.status === 401 || 
             (errorJson.error && (errorJson.error.code === 190 || errorJson.error.message?.includes('access token')))) {
            console.error(`❌ Error de autenticación - Token inválido o expirado. Se requiere actualización manual del token.`);
          }
        } catch (e) {
          // Si no es JSON, mostrar como texto
          console.error(`❌ Error no analizable: ${errorData}`);
        }
        
        throw new Error(`Error enviando mensaje a WhatsApp: ${whatsappResponse.status}`);
      }
      
      const responseData = await whatsappResponse.json();
      console.log(`📲 Mensaje enviado a WhatsApp, ID: ${responseData.messages?.[0]?.id}`);
      
      // Guardar mensaje enviado en la base de datos
      await supabase
        .from('whatsapp_messages')
        .insert({
          user_id: config.user_id,
          phone_number_id: phoneNumberId,
          chatbot_id: config.active_chatbot_id,
          conversation_id: conversation.id,
          wa_message_id: responseData.messages?.[0]?.id,
          from_number: phoneNumberId,
          to_number: message.from,
          message_type: 'text',
          message_content: response,
          direction: 'outbound',
          status: 'sent',
          timestamp: new Date().toISOString(),
          metadata: {
            response_data: responseData
          }
        });
      
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
