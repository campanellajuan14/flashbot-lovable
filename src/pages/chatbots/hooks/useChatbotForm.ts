
import { ChatbotTemplate } from "../templates/types";
import { UseChatbotFormProps, UseChatbotFormReturn } from "./form-types";
import { useFormState } from "./useFormState";
import { useChatbotData } from "./useChatbotData";
import { useSaveChatbot } from "./useSaveChatbot";

export const useChatbotForm = ({ id, userId }: UseChatbotFormProps): UseChatbotFormReturn => {
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
  
  // Load chatbot data if editing
  const { isLoading } = useChatbotData(
    id, 
    userId, 
    setForm, 
    setAiProvider,
    handleNestedChange
  );
  
  // Save chatbot data
  const { isSubmitting, isEditing, handleSubmit: submitChatbot } = useSaveChatbot(userId, id);
  
  // Handle template selection
  const handleTemplateSelect = (template: ChatbotTemplate) => {
    setSelectedTemplateId(template.id);
    
    setForm(prev => ({
      ...prev,
      name: prev.name || template.name,
      description: prev.description || template.description,
      personality: template.personality,
      settings: template.settings
    }));
    
    // Set the correct provider based on the template model
    if (template.settings.model.includes('claude')) {
      setAiProvider("claude");
    } else {
      setAiProvider("openai");
    }
  };
  
  // Wrap the handleSubmit function to pass the form data
  const handleSubmit = (e: React.FormEvent) => submitChatbot(e, form);

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
