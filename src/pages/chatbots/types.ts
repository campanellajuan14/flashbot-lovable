
import { Json } from "@/integrations/supabase/types";

export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
  references?: any[];
}

export interface Chatbot {
  id: string;
  name: string;
  description: string;
  user_id: string;
  is_active: boolean;
  behavior: ChatbotPersonality | Json;
  settings?: Record<string, any>;
  document_count?: number;
  created_at?: string;
  updated_at?: string;
  share_settings?: Json;
}

export interface ChatbotPersonality {
  tone: string;
  style: string;
  language: string;
  useEmojis: boolean;
  askQuestions: boolean;
  suggestSolutions: boolean;
  instructions: string;
  greeting: string;
  usePersonality: boolean;
}

export interface ChatbotFormData {
  id?: string;
  name: string;
  description: string;
  isActive: boolean;
  personality: ChatbotPersonality;
  settings: Settings;
}

export interface ChatbotTemplate {
  id: string;
  name: string;
  description: string;
  personality: ChatbotPersonality;
  settings: Settings;
}

export interface Settings {
  model: string;
  temperature: number;
  maxTokens: number;
  includeReferences: boolean;
}

export interface Personality extends ChatbotPersonality {}

export interface ChatbotWithDocuments extends Chatbot {
  document_count: number;
}

export interface ChatbotData {
  id?: string;
  name: string;
  description: string;
  is_active: boolean;
  behavior: Json;
  settings: Json;
  user_id: string;
}
