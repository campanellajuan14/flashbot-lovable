
// Tipos para las nuevas tablas de WhatsApp
export interface WhatsAppConfig {
  id: string;
  user_id: string;
  phone_number_id: string;
  waba_id: string;
  secret_id: string;
  is_active: boolean;
  webhook_verified: boolean;
  active_chatbot_id: string | null;
  created_at: string;
  updated_at: string;
  webhook_verify_token: string;
}

export interface WhatsAppMessage {
  id: string;
  user_id: string;
  phone_number_id: string;
  chatbot_id?: string;
  conversation_id?: string;
  wa_message_id?: string;
  from_number: string;
  to_number: string;
  message_type: string;
  message_content: string;
  direction: 'inbound' | 'outbound';
  status?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}
