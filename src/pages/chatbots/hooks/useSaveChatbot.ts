
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChatbotFormData, ChatbotPersonality, Settings } from "../types";

/**
 * Hook to handle saving chatbot data
 */
export const useSaveChatbot = (userId: string | undefined, id?: string) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;
  
  const handleSubmit = async (form: ChatbotFormData) => {
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
      // Convert our strongly typed data to Json for Supabase
      const chatbotData: {
        name: string;
        description: string;
        is_active: boolean;
        behavior: any; // Using any for Json compatibility
        settings: any;  // Using any for Json compatibility
        user_id: string;
        id?: string;   // Make id optional but add it if editing
      } = {
        name: form.name,
        description: form.description,
        is_active: form.isActive,
        behavior: form.personality as any, // Cast to any for Json compatibility
        settings: form.settings as any,    // Cast to any for Json compatibility
        user_id: userId
      };
      
      if (isEditing && id) {
        chatbotData.id = id; // Add id for updates
      }
      
      console.log("Saving chatbot with data:", chatbotData);
      
      let result;
      let newChatbotId: string | undefined;
      let tempChatbotId: string | undefined;
      
      if (isEditing && id) {
        result = await supabase
          .from('chatbots')
          .update(chatbotData as any)
          .eq('id', id)
          .eq('user_id', userId);
        newChatbotId = id;
      } else {
        // Check if we have a temp chatbot ID in localStorage
        tempChatbotId = localStorage.getItem('temp_chatbot_id');
        
        result = await supabase
          .from('chatbots')
          .insert(chatbotData as any)
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
      
      // Use a timeout to ensure the toast shows before navigation
      setTimeout(() => {
        navigate("/chatbots");
      }, 500);
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
