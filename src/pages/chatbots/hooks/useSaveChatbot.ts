
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
      let newChatbotId: string | undefined;
      let tempChatbotId: string | undefined;
      
      if (isEditing) {
        result = await supabase
          .from('chatbots')
          .update(chatbotData)
          .eq('id', id)
          .eq('user_id', userId);
        newChatbotId = id;
      } else {
        // Check if we have a temp chatbot ID in localStorage
        tempChatbotId = localStorage.getItem('temp_chatbot_id');
        
        result = await supabase
          .from('chatbots')
          .insert(chatbotData)
          .select('id');
        
        // Get the new chatbot ID from the insert response
        newChatbotId = result.data?.[0]?.id;
      }
      
      const { error } = result;
      
      if (error) throw error;
      
      // Process any temporarily uploaded documents if this was a new chatbot
      if (!isEditing && newChatbotId && tempChatbotId) {
        console.log(`New chatbot created with ID: ${newChatbotId}, processing documents from temp ID: ${tempChatbotId}`);
        await processTemporaryDocuments(newChatbotId, tempChatbotId, userId);
        localStorage.removeItem('temp_chatbot_id');
      }
      
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
  
  // Helper function to process temporarily stored documents after chatbot creation
  const processTemporaryDocuments = async (chatbotId: string, tempChatbotId: string, userId: string | undefined) => {
    try {
      console.log(`Processing temporary documents from ${tempChatbotId} to ${chatbotId}`);
      
      // Process the temp documents by calling the edge function
      const { data, error } = await supabase.functions.invoke('process-temp-documents', {
        body: {
          realChatbotId: chatbotId,
          tempChatbotId: tempChatbotId,
          userId
        }
      });
      
      if (error) {
        console.error("Error processing temporary documents:", error);
        return;
      }
      
      console.log("Temporary documents processed:", data);
      
      if (data && data.processed > 0) {
        toast({
          title: "Documentos procesados",
          description: `${data.processed} documentos han sido procesados exitosamente.`,
        });
      }
    } catch (error) {
      console.error("Error processing temporary documents:", error);
      toast({
        variant: "destructive",
        title: "Advertencia",
        description: "Algunos documentos pueden no haberse procesado correctamente.",
      });
    }
  };
  
  return { isSubmitting, isEditing, handleSubmit };
};
