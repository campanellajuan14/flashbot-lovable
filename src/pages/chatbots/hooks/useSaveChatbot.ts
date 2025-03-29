
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
      
      if (isEditing) {
        result = await supabase
          .from('chatbots')
          .update(chatbotData)
          .eq('id', id)
          .eq('user_id', userId);
        newChatbotId = id;
      } else {
        result = await supabase
          .from('chatbots')
          .insert(chatbotData)
          .select('id');
        
        // Get the new chatbot ID from the insert response
        newChatbotId = result.data?.[0]?.id;
      }
      
      const { error } = result;
      
      if (error) throw error;
      
      // Process any temporarily stored documents if this was a new chatbot
      if (!isEditing && newChatbotId) {
        await processTemporaryDocuments(newChatbotId, userId);
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
  const processTemporaryDocuments = async (chatbotId: string, userId: string | undefined) => {
    try {
      // Search localStorage for any temp docs for this chatbot
      const tempKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('temp_docs_temp-')) {
          tempKeys.push(key);
        }
      }
      
      if (tempKeys.length === 0) {
        console.log("No temporary documents found to process");
        return;
      }
      
      console.log(`Found ${tempKeys.length} temporary document collections to process`);
      
      for (const key of tempKeys) {
        try {
          const tempDocsJson = localStorage.getItem(key);
          if (!tempDocsJson) continue;
          
          const tempDocs = JSON.parse(tempDocsJson);
          console.log(`Processing ${tempDocs.length} temporary documents for ${chatbotId}`);
          
          // Process each temporary document
          for (const doc of tempDocs) {
            try {
              // Generate embedding
              const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke('process-documents', {
                body: {
                  chatbotId: chatbotId, // Use the real chatbot ID now
                  text: doc.content,
                  fileName: doc.metadata.fileName,
                  fileType: doc.metadata.fileType,
                  userId: userId,
                  retrievalSettings: {
                    chunk_size: 1000,
                    chunk_overlap: 200,
                    embedding_model: "text-embedding-ada-002"
                  }
                }
              });
              
              if (embeddingError) {
                console.error("Error processing temporary document:", embeddingError);
                continue;
              }
              
              console.log("Successfully processed temporary document:", doc.name);
            } catch (docError) {
              console.error("Error processing individual temp doc:", docError);
            }
          }
          
          // Remove the processed temp docs from localStorage
          localStorage.removeItem(key);
          console.log(`Removed processed temporary documents: ${key}`);
        } catch (keyError) {
          console.error(`Error processing temporary documents for key ${key}:`, keyError);
        }
      }
    } catch (error) {
      console.error("Error processing temporary documents:", error);
    }
  };
  
  return { isSubmitting, isEditing, handleSubmit };
};
