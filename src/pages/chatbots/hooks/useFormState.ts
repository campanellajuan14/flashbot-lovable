
import { useState, useCallback } from "react";
import { ChatbotFormData, Settings, ChatbotPersonality } from "../types";
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
  
  // Create strongly typed default settings
  const initialSettings: Settings = {
    model: defaultSettings.model,
    temperature: defaultTemperature,
    maxTokens: defaultMaxTokens,
    includeReferences: defaultSettings.includeReferences
  };
  
  // Create strongly typed default personality
  const initialPersonality: ChatbotPersonality = {
    tone: defaultPersonality.tone,
    style: defaultPersonality.style,
    language: defaultPersonality.language,
    useEmojis: defaultPersonality.useEmojis,
    askQuestions: defaultPersonality.askQuestions,
    suggestSolutions: defaultPersonality.suggestSolutions,
    instructions: defaultPersonality.instructions || "",
    greeting: defaultPersonality.greeting,
    usePersonality: defaultPersonality.usePersonality
  };
  
  // Form state
  const [form, setForm] = useState<ChatbotFormData>({
    name: "",
    description: "",
    isActive: true,
    personality: initialPersonality,
    settings: initialSettings
  });
  
  // Template selection
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  
  // AI provider state (Claude or OpenAI)
  const [aiProvider, setAiProvider] = useState<"claude" | "openai">("claude");

  // Form state change handlers - memoized with useCallback
  const handleChange = useCallback((field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);
  
  const handleNestedChange = useCallback((parent: string, field: string, value: any) => {
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
  }, []);
  
  const handleProviderChange = useCallback((provider: "claude" | "openai") => {
    setAiProvider(provider);
    // Set a default model based on the provider
    const defaultModel = provider === "claude" 
      ? "claude-3-5-sonnet-20241022" 
      : "gpt-4o";
    
    handleNestedChange("settings", "model", defaultModel);
  }, [handleNestedChange]);

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
