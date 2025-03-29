
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
    if (!files || files.length === 0 || !chatbotId) {
      console.error("Missing files or invalid chatbot ID");
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
      
      console.log(`Processing ${files.length} files for chatbot ${chatbotId}`);
      
      const filePromises = Array.from(files).map(async (file) => {
        const text = await file.text();
        
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
      });
      
      await Promise.all(filePromises);
      
      setUploadProgress(100);
      onUploadComplete();
      
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error("Error uploading documents:", error);
      setUploading(false);
      setUploadProgress(0);
      
      // Verificar error específico de OpenAI API
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
