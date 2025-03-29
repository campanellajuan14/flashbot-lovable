
import { useState } from "react";
import { ChatbotFormData } from "../types";
import { defaultPersonality, defaultSettings } from "../constants";

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
    settings: {
      ...defaultSettings,
      // Ensure numeric types are properly initialized
      maxTokens: typeof defaultSettings.maxTokens === 'string' 
        ? parseInt(defaultSettings.maxTokens, 10) 
        : defaultSettings.maxTokens,
      temperature: typeof defaultSettings.temperature === 'string'
        ? parseFloat(defaultSettings.temperature)
        : defaultSettings.temperature
    }
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
    // Set a default model based on the provider
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
