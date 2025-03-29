
import { Json } from "@/integrations/supabase/types";

export interface Personality {
  tone: string;
  style: string;
  language: string;
  instructions: string;
  greeting: string;
}

export interface Settings {
  model: string;
  temperature: number;
  maxTokens: number;
  includeReferences: boolean;
}

export interface ChatbotFormData {
  name: string;
  description: string;
  isActive: boolean;
  personality: Personality;
  settings: Settings;
}

export interface ChatbotData {
  name: string;
  description: string;
  is_active: boolean;
  behavior: Json;
  settings: Json;
  user_id: string;
}

export interface Chatbot {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  user_id: string;
  settings: Record<string, any>;
  behavior: Record<string, any>;
}

export interface ChatbotWithDocuments extends Chatbot {
  documentCount: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
  references?: any[];
}

export interface VoiceChatMessage {
  type: string;
  content?: string;
  role?: string;
  function_call?: any;
  tool_calls?: any[];
}
