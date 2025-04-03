
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

/**
 * Estructura de plantillas de WhatsApp
 */
export interface WhatsAppTemplate {
  name: string;
  language: {
    code: string;  // ej: "en_US", "es_ES"
  };
  components?: Array<{
    type: "header" | "body" | "footer" | "button";
    parameters?: Array<{
      type: "text" | "currency" | "date_time" | "image" | "document" | "video";
      text?: string;
      currency?: {
        fallback_value: string;
        code: string;
        amount_1000: number;
      };
      date_time?: {
        fallback_value: string;
      };
      image?: {
        link: string;
      };
      document?: {
        link: string;
      };
      video?: {
        link: string;
      };
    }>;
    sub_type?: "url" | "quick_reply" | "call_to_action";
    index?: number;
  }>;
}

/**
 * Tipos de mensajes WhatsApp
 */
export enum WhatsAppMessageType {
  TEXT = "text",
  TEMPLATE = "template",
  IMAGE = "image",
  DOCUMENT = "document",
  AUDIO = "audio",
  VIDEO = "video",
  STICKER = "sticker",
  LOCATION = "location",
  CONTACTS = "contacts",
  INTERACTIVE = "interactive"
}
