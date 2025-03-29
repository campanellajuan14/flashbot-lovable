
import { useState } from "react";
import { ChatbotFormData } from "../types";
import { defaultPersonality, defaultSettings } from "../constants";
import { determineAiProvider } from "./form-utils";

/**
 * Hook to manage form state
 */
export const useFormState = () => {
  // Form state
  const [form, setForm] = useState<ChatbotFormData>({
    name: "",
    description: "",
    isActive: true,
    personality: defaultPersonality,
    settings: defaultSettings
  });
  
  // Template selection
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  
  // AI provider state (Claude or OpenAI)
  const [aiProvider, setAiProvider] = useState<"claude" | "openai">("claude");

  // Form state change handlers
  const handleChange = (field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleNestedChange = (parent: string, field: string, value: any) => {
    setForm(prev => {
      const parentValue = prev[parent as keyof typeof prev];
      if (typeof parentValue === 'object' && parentValue !== null) {
        return {
          ...prev,
          [parent]: {
            ...parentValue,
            [field]: value
          }
        };
      }
      return prev;
    });
  };
  
  const handleProviderChange = (provider: "claude" | "openai") => {
    setAiProvider(provider);
    // Establecer un modelo predeterminado según el proveedor
    const defaultModel = provider === "claude" 
      ? "claude-3-haiku-20240307" 
      : "gpt-4o";
    
    handleNestedChange("settings", "model", defaultModel);
  };

  return {
    form,
    setForm,
    selectedTemplateId,
    setSelectedTemplateId,
    aiProvider,
    setAiProvider,
    handleChange,
    handleNestedChange,
    handleProviderChange
  };
};
