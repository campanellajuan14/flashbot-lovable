
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
