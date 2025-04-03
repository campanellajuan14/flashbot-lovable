
/**
 * Extiende los tipos existentes de WebhookMessage
 */
export interface WebhookMessage {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: {
            body: string;
          };
          type: string;
          [key: string]: unknown;
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

/**
 * Configuración de WhatsApp
 */
export interface WhatsAppConfig {
  user_id: string;
  active_chatbot_id: string;
  is_active: boolean;
  secret_id: string;
}

/**
 * Información de Chatbot
 */
export interface ChatbotInfo {
  id: string;
  name: string;
  behavior: Record<string, any>;
  settings: Record<string, any>;
}

/**
 * Respuesta de WhatsApp API
 */
export interface WhatsAppApiResponse {
  messaging_product: string;
  contacts?: Array<{
    input: string;
    wa_id: string;
  }>;
  messages?: Array<{
    id: string;
  }>;
}

/**
 * Resultado del procesamiento de mensajes
 */
export interface MessageProcessResult {
  success: boolean;
  message_id?: string;
  error?: string;
}
