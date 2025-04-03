
/**
 * Procesar actualizaciones de estado de mensajes
 */
export async function processMessageStatus(
  supabase: any,
  phoneNumberId: string,
  status: any
) {
  try {
    console.log(`📊 Actualizando estado de mensaje: ${status.id} a "${status.status}"`);
    
    // Actualizar estado del mensaje en la base de datos
    const { error } = await supabase
      .from('whatsapp_messages')
      .update({
        status: status.status,
        metadata: supabase.utils.Json.stringify({
          ...status,
          updated_at: new Date().toISOString()
        })
      })
      .eq('wa_message_id', status.id);
      
    if (error) {
      console.error(`❌ Error actualizando estado del mensaje: ${error.message}`);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`❌ Error procesando estado del mensaje: ${error.message}`);
    return { success: false, error: error.message };
  }
}
