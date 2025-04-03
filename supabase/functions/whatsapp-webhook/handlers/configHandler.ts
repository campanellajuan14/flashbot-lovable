
/**
 * Manejador de configuraciones de WhatsApp
 */
export async function getWhatsAppConfig(
  supabase: any,
  phoneNumberId: string
) {
  try {
    console.log(`📱 Obteniendo configuración para phone_number_id: ${phoneNumberId}`);
    
    // Obtener la configuración para este número de teléfono
    const { data: config, error: configError } = await supabase
      .from('user_whatsapp_config')
      .select('user_id, active_chatbot_id, is_active, secret_id')
      .eq('phone_number_id', phoneNumberId)
      .single();
      
    if (configError || !config) {
      console.error(`❌ Error obteniendo configuración de WhatsApp: ${configError?.message || 'No encontrada'}`);
      return { config: null, error: 'Config not found' };
    }
    
    // Verificar si WhatsApp está activo
    if (!config.is_active) {
      console.log(`⚠️ WhatsApp está desactivado para este número: ${phoneNumberId}`);
      return { config: null, error: 'WhatsApp integration is disabled' };
    }
    
    // Verificar si hay un chatbot activo
    if (!config.active_chatbot_id) {
      console.error(`❌ No hay chatbot configurado para este número: ${phoneNumberId}`);
      return { config: null, error: 'No active chatbot configured' };
    }
    
    console.log(`✅ Configuración correcta - Chatbot ID: ${config.active_chatbot_id}`);
    
    return { config, error: null };
  } catch (error) {
    console.error(`❌ Error obteniendo configuración: ${error.message}`);
    return { config: null, error: error.message };
  }
}

/**
 * Obtiene información del chatbot configurado
 */
export async function getChatbotInfo(
  supabase: any,
  chatbotId: string
) {
  try {
    // Obtener información del chatbot para generar respuesta
    const { data: chatbot, error: chatbotError } = await supabase
      .from('chatbots')
      .select('id, name, behavior, settings')
      .eq('id', chatbotId)
      .single();
      
    if (chatbotError || !chatbot) {
      console.error(`❌ Error obteniendo detalles del chatbot: ${chatbotError?.message || 'Not found'}`);
      return { chatbot: null, error: 'Chatbot not found' };
    }
    
    console.log(`🤖 Chatbot encontrado: ${chatbot.name}`);
    return { chatbot, error: null };
  } catch (error) {
    console.error(`❌ Error obteniendo chatbot: ${error.message}`);
    return { chatbot: null, error: error.message };
  }
}
