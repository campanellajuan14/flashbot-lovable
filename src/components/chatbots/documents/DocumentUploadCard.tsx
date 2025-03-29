
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { CloudUpload, FileText } from "lucide-react";
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
        <CardTitle className="flex items-center gap-2">
          <CloudUpload className="h-5 w-5 text-primary" />
          Upload Documents
        </CardTitle>
        <CardDescription>
          Upload documents to improve your chatbot's responses. Supported formats: PDF, TXT, MD, CSV.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ErrorDisplay errorMessage={errorMessage} />
        
        <p className="text-sm text-muted-foreground mb-4">
          You can upload our sample Hackathon documentation (download above) 
          or your own documents to test the knowledge base functionality.
        </p>
        
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
