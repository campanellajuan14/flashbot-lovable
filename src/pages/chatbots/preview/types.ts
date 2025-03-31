
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
  behavior: {
    tone?: string;
    style?: string;
    language?: string;
    useEmojis?: boolean;
    askQuestions?: boolean;
    suggestSolutions?: boolean;
    instructions?: string;
    greeting?: string;
  };
  settings?: Record<string, any>;
}
