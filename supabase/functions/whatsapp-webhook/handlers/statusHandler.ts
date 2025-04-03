
/**
 * Process message status updates from WhatsApp
 */
export async function processMessageStatus(supabase: any, phoneNumberId: string, status: any) {
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
