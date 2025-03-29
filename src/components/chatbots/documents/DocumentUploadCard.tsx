
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { CloudUpload } from "lucide-react";
import ErrorDisplay from "./upload/ErrorDisplay";
import UploadArea from "./upload/UploadArea";
import { useDocumentUpload } from "./upload/useDocumentUpload";

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
  const {
    uploading,
    uploadProgress,
    dragActive,
    setDragActive,
    errorMessage,
    handleDrag,
    handleDrop,
    handleFileUpload
  } = useDocumentUpload({
    chatbotId,
    userId,
    retrievalSettings,
    onUploadComplete
  });
  
  return (
    <Card id="upload-card">
      <CardHeader>
        <CardTitle>Subir documentos</CardTitle>
        <CardDescription>
          Sube documentos para mejorar las respuestas de tu chatbot. Formatos soportados: PDF, TXT, CSV.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ErrorDisplay errorMessage={errorMessage} />
        
        <UploadArea
          onFileSelect={handleFileUpload}
          uploading={uploading}
          uploadProgress={uploadProgress}
          dragActive={dragActive}
          setDragActive={setDragActive}
          handleDrag={handleDrag}
          handleDrop={handleDrop}
        />
      </CardContent>
    </Card>
  );
};

export default DocumentUploadCard;
