
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
  behavior: ChatbotPersonality;
  settings?: Record<string, any>;
  document_count?: number;
}

// Update the personality type to include the new usePersonality flag
export interface ChatbotPersonality {
  tone?: string;
  style?: string;
  language?: string;
  useEmojis?: boolean;
  askQuestions?: boolean;
  suggestSolutions?: boolean;
  instructions?: string;
  greeting?: string;
  usePersonality?: boolean; // New flag to toggle personality features
}

export interface ChatbotFormData {
  id?: string;
  name: string;
  description: string;
  isActive: boolean;
  personality: ChatbotPersonality;
  settings: Record<string, any>;
}

export interface ChatbotTemplate {
  id: string;
  name: string;
  description: string;
  personality: ChatbotPersonality;
  settings: Record<string, any>;
}

// Add missing types that were referenced in the errors
export interface ChatbotData extends Omit<Chatbot, 'behavior' | 'settings'> {
  behavior: ChatbotPersonality;
  settings: Settings;
}

export interface Settings {
  model: string;
  temperature: number;
  maxTokens: number;
  includeReferences: boolean;
}

export interface Personality extends ChatbotPersonality {}

// Add the ChatbotWithDocuments type that was referenced in errors
export interface ChatbotWithDocuments extends Chatbot {
  document_count: number;
}
