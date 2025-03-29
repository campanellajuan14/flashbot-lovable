
import { Personality, Settings } from "../types";

export interface ChatbotTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "customer-service" | "sales" | "technical" | "general";
  personality: Personality;
  settings: Settings;
}
