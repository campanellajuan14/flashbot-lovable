
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChatbotFormData, ChatbotData } from "../types";

/**
 * Hook to handle saving chatbot data
 */
export const useSaveChatbot = (userId: string | undefined, id?: string) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;
  
  const handleSubmit = async (e: React.FormEvent, form: ChatbotFormData) => {
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
  
  return { isSubmitting, isEditing, handleSubmit };
};
