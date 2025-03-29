
import { ChatbotFormData, ChatbotData, Personality, Settings } from "../types";
import { ChatbotTemplate } from "../templates/types";

export interface UseChatbotFormProps {
  id?: string;
  userId?: string;
}

export interface UseChatbotFormReturn {
  form: ChatbotFormData;
  aiProvider: "claude" | "openai";
  isSubmitting: boolean;
  isLoading: boolean;
  isEditing: boolean;
  selectedTemplateId: string | null;
  handleChange: (field: string, value: any) => void;
  handleNestedChange: (parent: string, field: string, value: any) => void;
  handleProviderChange: (provider: "claude" | "openai") => void;
  handleTemplateSelect: (template: ChatbotTemplate) => void;
  handleSubmit: (formData?: ChatbotFormData) => Promise<void>;
}
