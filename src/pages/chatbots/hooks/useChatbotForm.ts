
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { defaultPersonality, defaultSettings } from "../constants";
import { ChatbotFormData, ChatbotData, Personality, Settings } from "../types";

interface UseChatbotFormProps {
  id?: string;
  userId?: string;
}

export const useChatbotForm = ({ id, userId }: UseChatbotFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;
  
  const [form, setForm] = useState<ChatbotFormData>({
    name: "",
    description: "",
    isActive: true,
    personality: defaultPersonality,
    settings: defaultSettings
  });
  
  const [aiProvider, setAiProvider] = useState<"claude" | "openai">("claude");

  useEffect(() => {
    if (isEditing && userId) {
      setIsLoading(true);
      
      const fetchChatbot = async () => {
        try {
          const { data, error } = await supabase
            .from('chatbots')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
          
          if (error) throw error;
          
          if (data) {
            let personalityData: Personality = { ...defaultPersonality };
            if (data.behavior && typeof data.behavior === 'object' && !Array.isArray(data.behavior)) {
              const behavior = data.behavior as Record<string, unknown>;
              personalityData = {
                tone: typeof behavior.tone === 'string' ? behavior.tone : defaultPersonality.tone,
                style: typeof behavior.style === 'string' ? behavior.style : defaultPersonality.style,
                language: typeof behavior.language === 'string' ? behavior.language : defaultPersonality.language,
                instructions: typeof behavior.instructions === 'string' ? behavior.instructions : defaultPersonality.instructions,
                greeting: typeof behavior.greeting === 'string' ? behavior.greeting : defaultPersonality.greeting
              };
            }
            
            let settingsData: Settings = { ...defaultSettings };
            if (data.settings && typeof data.settings === 'object' && !Array.isArray(data.settings)) {
              const settings = data.settings as Record<string, unknown>;
              settingsData = {
                model: typeof settings.model === 'string' ? settings.model : defaultSettings.model,
                temperature: typeof settings.temperature === 'number' ? settings.temperature : defaultSettings.temperature,
                maxTokens: typeof settings.maxTokens === 'number' ? settings.maxTokens : defaultSettings.maxTokens,
                includeReferences: typeof settings.includeReferences === 'boolean' ? settings.includeReferences : defaultSettings.includeReferences
              };
            }
            
            setForm({
              name: data.name,
              description: data.description || "",
              isActive: data.is_active,
              personality: personalityData,
              settings: settingsData
            });
            
            if (settingsData.model.includes('claude')) {
              setAiProvider("claude");
            } else {
              setAiProvider("openai");
            }
          }
        } catch (error) {
          console.error("Error fetching chatbot:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo cargar el chatbot",
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchChatbot();
    }
  }, [id, isEditing, userId, toast]);
  
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
    const defaultModel = provider === "claude" 
      ? "claude-3-haiku-20240307" 
      : "gpt-4o";
    
    handleNestedChange("settings", "model", defaultModel);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes iniciar sesión para crear un chatbot",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const chatbotData: ChatbotData = {
        name: form.name,
        description: form.description,
        is_active: form.isActive,
        behavior: form.personality as any,
        settings: form.settings as any,
        user_id: userId
      };
      
      console.log("Saving chatbot with data:", chatbotData);
      
      let result;
      
      if (isEditing) {
        result = await supabase
          .from('chatbots')
          .update(chatbotData)
          .eq('id', id)
          .eq('user_id', userId);
      } else {
        result = await supabase
          .from('chatbots')
          .insert(chatbotData);
      }
      
      const { error } = result;
      
      if (error) throw error;
      
      toast({
        title: isEditing ? "Chatbot actualizado" : "Chatbot creado",
        description: `${form.name} ha sido ${isEditing ? "actualizado" : "creado"} exitosamente.`,
      });
      
      navigate("/chatbots");
    } catch (error: any) {
      console.error("Error saving chatbot:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar el chatbot. Inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    aiProvider,
    isSubmitting,
    isLoading,
    isEditing,
    handleChange,
    handleNestedChange,
    handleProviderChange,
    handleSubmit
  };
};
