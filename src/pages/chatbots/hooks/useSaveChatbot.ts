
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
    if (e) {
      e.preventDefault(); // Ensure we prevent form submission
      e.stopPropagation(); // Stop event propagation
    }
    
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to create a chatbot",
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
        
        try {
          const { data: processResult, error: processError } = await supabase.functions.invoke('process-temp-documents', {
            body: {
              realChatbotId: newChatbotId,
              tempChatbotId: tempChatbotId,
              userId
            }
          });
          
          if (processError) {
            console.error("Error processing temporary documents:", processError);
          } else {
            console.log("Temporary documents processed:", processResult);
            
            if (processResult && processResult.processed > 0) {
              toast({
                title: "Documents processed",
                description: `${processResult.processed} documents have been successfully processed.`,
              });
            }
          }
        } catch (processError) {
          console.error("Error processing temporary documents:", processError);
        }
        
        // Clean up the temp ID from localStorage
        localStorage.removeItem('temp_chatbot_id');
      }
      
      toast({
        title: isEditing ? "Chatbot updated" : "Chatbot created",
        description: `${form.name} has been ${isEditing ? "updated" : "created"} successfully.`,
      });
      
      navigate("/chatbots");
    } catch (error: any) {
      console.error("Error saving chatbot:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not save chatbot. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return { isSubmitting, isEditing, handleSubmit };
};
