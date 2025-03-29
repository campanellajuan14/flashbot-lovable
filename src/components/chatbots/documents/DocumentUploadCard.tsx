
import React, { useState, useRef } from "react";
import { 
  Button, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  useToast
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { Upload, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DocumentUploadCardProps {
  chatbotId: string;
  userId: string;
  retrievalSettings: any;
  onUploadComplete: () => void;
}

const DocumentUploadCard = ({
  chatbotId,
  userId,
  retrievalSettings,
  onUploadComplete
}: DocumentUploadCardProps) => {
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !chatbotId) {
      console.error("Missing files or invalid chatbot ID");
      return;
    }
    
    if (!userId) {
      toast({
        title: "Error",
        description: "No se pudo encontrar la información del usuario.",
        variant: "destructive",
      });
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
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
        
        console.log("Document processing result:", data);
        return data;
      });
      
      await Promise.all(filePromises);
      
      setUploadProgress(100);
      
      toast({
        title: "Documentos subidos",
        description: `Se subieron ${files.length} documento(s) correctamente.`,
      });
      
      onUploadComplete();
      
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error("Error uploading documents:", error);
      setUploading(false);
      setUploadProgress(0);
      
      toast({
        title: "Error al subir documentos",
        description: "Ocurrió un error al procesar los documentos. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subir documentos</CardTitle>
        <CardDescription>
          Sube documentos para mejorar las respuestas de tu chatbot. Formatos soportados: PDF, TXT, CSV.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20",
            uploading && "opacity-50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-medium">
              Arrastra archivos aquí o haz clic para seleccionar
            </h3>
            <p className="text-sm text-muted-foreground">
              Archivos compatibles: PDF, TXT, CSV, DOC, DOCX
            </p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.txt,.csv,.doc,.docx"
              onChange={(e) => handleFileUpload(e.target.files)}
              disabled={uploading}
            />
            <Button
              type="button"
              onClick={handleFileButtonClick}
              disabled={uploading}
              className="mt-2"
            >
              Seleccionar archivos
            </Button>
          </div>
          
          {uploading && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-1">
                Subiendo... {uploadProgress}%
              </p>
              <div className="w-full bg-secondary rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUploadCard;
