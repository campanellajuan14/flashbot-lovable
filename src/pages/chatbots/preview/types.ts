
import { Json } from "@/integrations/supabase/types";
import { ChatbotPersonality } from "../types";

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
  behavior: ChatbotPersonality | Json;  // Allow Json type for API responses
  settings?: Record<string, any>;
  // Include additional fields from DB schema
  created_at?: string;
  updated_at?: string;
  share_settings?: Json;
}
