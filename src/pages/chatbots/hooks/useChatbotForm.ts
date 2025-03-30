
import { useState, useCallback } from "react";
import { ChatbotTemplate } from "../templates/types";
import { UseChatbotFormProps, UseChatbotFormReturn } from "./form-types";
import { useFormState } from "./useFormState";
import { useChatbotData } from "./useChatbotData";
import { useSaveChatbot } from "./useSaveChatbot";

export const useChatbotForm = ({ id, userId }: UseChatbotFormProps): UseChatbotFormReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Form state management
  const {
    form,
    setForm,
    selectedTemplateId,
    setSelectedTemplateId,
    aiProvider,
    setAiProvider,
    handleChange,
    handleNestedChange,
    handleProviderChange
  } = useFormState();
  
  console.log("useChatbotForm: Initialized form state", { 
    id, 
    userId, 
    isEditing: !!id,
    selectedTemplateId 
  });
  
  // Load chatbot data if editing
  const { isLoading } = useChatbotData(
    id, 
    userId, 
    useCallback((newForm) => {
      console.log("useChatbotForm: Setting form from loaded data", newForm);
      setForm(newForm);
      setIsInitialized(true);
    }, [setForm]),
    setAiProvider,
    handleNestedChange
  );
  
  // Save chatbot data
  const { isSubmitting, isEditing, handleSubmit: submitChatbot } = useSaveChatbot(userId, id);
  
  // Handle template selection
  const handleTemplateSelect = useCallback((template: ChatbotTemplate) => {
    console.log("useChatbotForm: Template selected", template);
    setSelectedTemplateId(template.id);
    
    // Ensure we're working with numbers for maxTokens and temperature
    const maxTokens = typeof template.settings.maxTokens === 'string' 
      ? parseInt(template.settings.maxTokens, 10) 
      : template.settings.maxTokens;
    
    const temperature = typeof template.settings.temperature === 'string'
      ? parseFloat(template.settings.temperature)
      : template.settings.temperature;
    
    setForm(prev => ({
      ...prev,
      name: prev.name || template.name,
      description: prev.description || template.description,
      personality: template.personality,
      settings: {
        ...template.settings,
        maxTokens: maxTokens || 500,
        temperature: temperature || 0.7
      }
    }));
    
    // Set the correct provider based on the template model
    if (template.settings.model.includes('claude')) {
      setAiProvider("claude");
    } else {
      setAiProvider("openai");
    }
  }, [setSelectedTemplateId, setForm, setAiProvider]);
  
  // Handle form submission with the form parameter
  const handleSubmit = useCallback((formData = form) => {
    console.log("useChatbotForm: Submitting form", formData);
    return submitChatbot(formData);
  }, [form, submitChatbot]);

  return {
    form,
    aiProvider,
    isSubmitting,
    isLoading,
    isEditing,
    selectedTemplateId,
    handleChange,
    handleNestedChange,
    handleProviderChange,
    handleTemplateSelect,
    handleSubmit
  };
};
