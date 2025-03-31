
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
  tone: string;
  style: string;
  language: string;
  useEmojis: boolean;
  askQuestions: boolean;
  suggestSolutions: boolean;
  instructions: string;
  greeting: string;
  usePersonality: boolean; // New flag to toggle personality features
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

// Define Settings type for consistent usage across components
export interface Settings {
  model: string;
  temperature: number;
  maxTokens: number;
  includeReferences: boolean;
}

export interface Personality extends ChatbotPersonality {}

// Define ChatbotWithDocuments type with required document_count
export interface ChatbotWithDocuments extends Chatbot {
  document_count: number;
}

// Define ChatbotData type for database operations
export interface ChatbotData {
  id?: string;
  name: string;
  description: string;
  is_active: boolean;
  behavior: Json;
  settings: Json;
  user_id: string;
}
