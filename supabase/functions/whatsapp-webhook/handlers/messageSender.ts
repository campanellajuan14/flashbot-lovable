
/**
 * Envía un mensaje de respuesta a WhatsApp
 */
export async function sendWhatsAppResponse(
  supabase: any,
  phoneNumberId: string, 
  toNumber: string, 
  response: string,
  token: string
) {
  try {
    console.log(`📤 Enviando respuesta a WhatsApp para ${toNumber}`);
    const whatsappResponse = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: toNumber,
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
          throw new Error("El token de WhatsApp es inválido o ha expirado. Por favor, actualiza el token en la configuración de WhatsApp.");
        }
      } catch (e) {
        // Si no es JSON, mostrar como texto
        console.error(`❌ Error no analizable: ${errorData}`);
      }
      
      throw new Error(`Error enviando mensaje a WhatsApp: ${whatsappResponse.status}`);
    }
    
    const responseData = await whatsappResponse.json();
    console.log(`📲 Mensaje enviado a WhatsApp, ID: ${responseData.messages?.[0]?.id}`);
    
    return { success: true, data: responseData };
  } catch (error) {
    console.error(`❌ Error en sendWhatsAppResponse: ${error.message}`);
    throw error;
  }
}

/**
 * Envía una plantilla de WhatsApp
 */
export async function sendWhatsAppTemplate(
  supabase: any,
  phoneNumberId: string,
  toNumber: string,
  templateName: string,
  languageCode: string = "es_ES",
  components: any[] = [],
  token: string
) {
  try {
    console.log(`📤 Enviando plantilla "${templateName}" a WhatsApp para ${toNumber}`);
    
    const templateData = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: toNumber,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode
        }
      }
    };
    
    // Añadir componentes si existen
    if (components && components.length > 0) {
      templateData.template.components = components;
    }
    
    console.log(`📄 Datos de plantilla: ${JSON.stringify(templateData)}`);
    
    const whatsappResponse = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templateData)
    });
    
    if (!whatsappResponse.ok) {
      const errorData = await whatsappResponse.text();
      console.error(`❌ Error enviando plantilla a WhatsApp: ${whatsappResponse.status} ${errorData}`);
      
      try {
        const errorJson = JSON.parse(errorData);
        console.error(`❌ Detalles del error de plantilla: ${JSON.stringify(errorJson)}`);
        
        // Manejo específico para errores comunes de plantillas
        if (errorJson.error && errorJson.error.message) {
          if (errorJson.error.message.includes("template not found")) {
            throw new Error(`La plantilla "${templateName}" no existe o no está aprobada.`);
          } else if (errorJson.error.message.includes("access token")) {
            throw new Error("El token de WhatsApp es inválido o ha expirado. Por favor, actualiza el token en la configuración.");
          }
        }
      } catch (e) {
        // Si no es JSON, mostrar como texto
        console.error(`❌ Error de plantilla no analizable: ${errorData}`);
      }
      
      throw new Error(`Error enviando plantilla a WhatsApp: ${whatsappResponse.status}`);
    }
    
    const responseData = await whatsappResponse.json();
    console.log(`📲 Plantilla enviada a WhatsApp, ID: ${responseData.messages?.[0]?.id}`);
    
    return { success: true, data: responseData };
  } catch (error) {
    console.error(`❌ Error en sendWhatsAppTemplate: ${error.message}`);
    throw error;
  }
}

/**
 * Guarda un mensaje enviado en la base de datos
 */
export async function saveOutboundMessage(
  supabase: any,
  userId: string,
  phoneNumberId: string,
  chatbotId: string,
  conversationId: string,
  fromNumber: string,
  toNumber: string,
  messageContent: string,
  responseData: any
) {
  try {
    await supabase
      .from('whatsapp_messages')
      .insert({
        user_id: userId,
        phone_number_id: phoneNumberId,
        chatbot_id: chatbotId,
        conversation_id: conversationId,
        wa_message_id: responseData.messages?.[0]?.id,
        from_number: fromNumber,
        to_number: toNumber,
        message_type: 'text',
        message_content: messageContent,
        direction: 'outbound',
        status: 'sent',
        timestamp: new Date().toISOString(),
        metadata: {
          response_data: responseData
        }
      });
      
    return { success: true };
  } catch (error) {
    console.error(`❌ Error guardando mensaje saliente: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Guarda un mensaje entrante en la base de datos
 */
export async function saveInboundMessage(
  supabase: any,
  userId: string,
  phoneNumberId: string,
  chatbotId: string,
  conversationId: string,
  message: any
) {
  try {
    const { error: messageError } = await supabase
      .from('whatsapp_messages')
      .insert({
        user_id: userId,
        phone_number_id: phoneNumberId,
        chatbot_id: chatbotId,
        conversation_id: conversationId,
        wa_message_id: message.id,
        from_number: message.from,
        to_number: phoneNumberId,
        message_type: 'text',
        message_content: message.text.body,
        direction: 'inbound',
        timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
        metadata: {
          sender_name: message.sender_name || 'Usuario',
          wa_message: message
        }
      });
      
    if (messageError) {
      console.error(`❌ Error guardando mensaje entrante: ${messageError.message}`);
      return { success: false, error: messageError.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`❌ Error guardando mensaje entrante: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Guarda un mensaje en la tabla genérica de mensajes
 */
export async function saveConversationMessage(
  supabase: any,
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
) {
  try {
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: role,
        content: content
      });
      
    return { success: true };
  } catch (error) {
    console.error(`❌ Error guardando mensaje en conversación: ${error.message}`);
    return { success: false, error: error.message };
  }
}
