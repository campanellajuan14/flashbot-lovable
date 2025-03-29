
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface UseDocumentUploadProps {
  chatbotId: string;
  userId: string;
  retrievalSettings: any;
  onUploadComplete: () => void;
}

export const useDocumentUpload = ({
  chatbotId,
  userId,
  retrievalSettings,
  onUploadComplete,
}: UseDocumentUploadProps) => {
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      console.error("No files to upload");
      return;
    }
    
    if (!userId) {
      setErrorMessage("User information could not be found.");
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);
    
    try {
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 300);
      
      console.log(`Processing ${files.length} files`);
      
      // Process files one by one
      const filePromises = Array.from(files).map(async (file) => {
        const text = await file.text();
        
        // Check if this is a temporary chatbot ID (starts with 'temp-')
        if (chatbotId.startsWith('temp-')) {
          console.log(`Sending file ${file.name} to temporary storage for chatbot: ${chatbotId}`);
          
          const documentData = {
            name: file.name,
            content: text,
            metadata: {
              fileType: file.type || 'text/plain',
              fileSize: file.size,
              uploadedAt: new Date().toISOString(),
              userId
            }
          };
          
          // Store document in temporary storage
          const { data, error } = await supabase.functions.invoke('kv-store-document', {
            body: {
              tempChatbotId: chatbotId,
              document: documentData
            }
          });
          
          if (error) {
            console.error("Error storing temporary document:", error);
            throw error;
          }
          
          return data;
        } else {
          // Regular document processing for existing chatbots
          console.log(`Sending file ${file.name} to process-documents function`);
          
          const { data, error } = await supabase.functions.invoke('process-documents', {
            body: {
              chatbotId,
              text,
              fileName: file.name,
              fileType: file.type || 'text/plain',
              userId,
              retrievalSettings
            }
          });
          
          if (error) {
            console.error("Error processing document:", error);
            throw error;
          }
          
          if (data && !data.success) {
            throw new Error(data.error || "Error processing document");
          }
          
          console.log("Document processing result:", data);
          return data;
        }
      });
      
      await Promise.all(filePromises);
      
      setUploadProgress(100);
      
      // Notify parent component that upload is complete
      onUploadComplete();
      
      // Show success toast
      toast({
        title: "Documents processed",
        description: "The documents have been processed successfully.",
      });
      
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error("Error uploading documents:", error);
      setUploading(false);
      setUploadProgress(0);
      
      // Check for specific OpenAI API error
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes("OpenAI API key not found")) {
        setErrorMessage("OpenAI API key not found. Please contact the system administrator to configure this key.");
      } else {
        setErrorMessage("An error occurred while processing the documents. Please try again.");
      }
    }
  };

  return {
    uploading,
    uploadProgress,
    dragActive,
    setDragActive,
    errorMessage,
    handleDrag,
    handleDrop,
    handleFileUpload
  };
};
