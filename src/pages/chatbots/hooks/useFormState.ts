
import { useState } from "react";
import { ChatbotFormData } from "../types";
import { defaultPersonality, defaultSettings } from "../constants";

/**
 * Hook to manage form state
 */
export const useFormState = () => {
  // Process default values to ensure proper types
  const defaultMaxTokens = typeof defaultSettings.maxTokens === 'string' 
    ? parseInt(defaultSettings.maxTokens, 10) || 500
    : defaultSettings.maxTokens || 500;
    
  const defaultTemperature = typeof defaultSettings.temperature === 'string'
    ? parseFloat(defaultSettings.temperature) || 0.7
    : defaultSettings.temperature || 0.7;
  
  // Form state
  const [form, setForm] = useState<ChatbotFormData>({
    name: "",
    description: "",
    isActive: true,
    personality: defaultPersonality,
    settings: {
      ...defaultSettings,
      maxTokens: defaultMaxTokens,
      temperature: defaultTemperature
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
        // Type conversion for known numeric fields
        let processedValue = value;
        
        if (parent === 'settings' && field === 'maxTokens') {
          processedValue = typeof value === 'string' && value !== '' 
            ? parseInt(value, 10) || 500
            : (typeof value === 'number' ? value : 500);
        }
        
        if (parent === 'settings' && field === 'temperature') {
          processedValue = typeof value === 'string' && value !== ''
            ? parseFloat(value) || 0.7 
            : (typeof value === 'number' ? value : 0.7);
        }
        
        return {
          ...prev,
          [parent]: {
            ...parentValue,
            [field]: processedValue
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
      ? "claude-3-5-sonnet-20241022" 
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
