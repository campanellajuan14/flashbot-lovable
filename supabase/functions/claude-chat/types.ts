
// Type definitions for the claude-chat function

export interface Message {
  role: string;
  content: string;
}

export interface ChatbotBehavior {
  tone?: string;
  style?: string;
  language?: string;
  useEmojis?: boolean;
  askQuestions?: boolean;
  suggestSolutions?: boolean;
  instructions?: string;
  greeting?: string;
}

export interface ChatbotSettings {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  includeReferences?: boolean;
}

export interface UserInfo {
  url?: string;
  userAgent?: string;
  referrer?: string;
}

export interface RequestData {
  messages: Message[];
  behavior?: ChatbotBehavior;
  chatbotName?: string;
  settings?: ChatbotSettings;
  chatbotId?: string;
  widget_id?: string;
  source?: string;
  conversationId?: string;
  user_info?: UserInfo;
  user_identifier?: string;
  request_id?: string;
}

export interface Document {
  id: string;
  name: string;
  content: string;
  similarity: number;
}

export interface ResponseData {
  message: string;
  model: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  conversation_id: string;
  references?: Array<{
    id: string;
    name: string;
    similarity: number;
  }>;
  used_fallback?: boolean; // Added field to indicate fallback was used
}

export interface AnthropicResponse {
  content: Array<{text: string}>;
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}
