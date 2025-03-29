
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { parsePersonalityData, parseSettingsData, determineAiProvider } from "./form-utils";
import { defaultPersonality, defaultSettings } from "../constants";

/**
 * Hook to load chatbot data for editing
 */
export const useChatbotData = (
  id: string | undefined, 
  userId: string | undefined,
  setForm: (form: any) => void,
  setAiProvider: (provider: "claude" | "openai") => void,
  handleNestedChange: (parent: string, field: string, value: any) => void
) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!id || !userId) return;
    
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
          let personalityData = { ...defaultPersonality };
          if (data.behavior && typeof data.behavior === 'object' && !Array.isArray(data.behavior)) {
            personalityData = parsePersonalityData(data.behavior as Record<string, unknown>);
          }
          
          let settingsData = { ...defaultSettings };
          if (data.settings && typeof data.settings === 'object' && !Array.isArray(data.settings)) {
            settingsData = parseSettingsData(data.settings as Record<string, unknown>);
          }
          
          setForm({
            name: data.name,
            description: data.description || "",
            isActive: data.is_active,
            personality: personalityData,
            settings: settingsData
          });
          
          // Determinar el proveedor basado en el modelo
          if (settingsData.model && settingsData.model.includes('claude')) {
            setAiProvider("claude");
          } else if (settingsData.model) {
            setAiProvider("openai");
          } else {
            // Si no hay modelo definido, usar Claude por defecto
            setAiProvider("claude");
            // Establecer un modelo Claude por defecto si no hay ninguno
            handleNestedChange("settings", "model", "claude-3-haiku-20240307");
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
  }, [id, userId, setForm, setAiProvider, handleNestedChange, toast]);
  
  return { isLoading };
};
