
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
  behavior: ChatbotPersonality;
  settings?: Record<string, any>;
}
