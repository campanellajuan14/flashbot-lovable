
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
      console.error("No hay archivos para subir");
      return;
    }
    
    if (!userId) {
      setErrorMessage("No se pudo encontrar la información del usuario.");
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
      
      console.log(`Procesando ${files.length} archivos`);
      
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
        title: "Documentos procesados",
        description: "Los documentos han sido procesados exitosamente.",
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
        setErrorMessage("No se ha configurado la clave de API de OpenAI. Contacte al administrador del sistema para configurar esta clave.");
      } else {
        setErrorMessage("Ocurrió un error al procesar los documentos. Por favor, inténtalo de nuevo.");
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
