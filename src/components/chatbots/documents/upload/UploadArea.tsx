
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Upload, Plus } from "lucide-react";

interface UploadAreaProps {
  onFileSelect: (files: FileList) => void;
  uploading: boolean;
  uploadProgress: number;
  dragActive: boolean;
  setDragActive: (active: boolean) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleDrag: (e: React.DragEvent) => void;
}

const UploadArea: React.FC<UploadAreaProps> = ({
  onFileSelect,
  uploading,
  uploadProgress,
  dragActive,
  setDragActive,
  handleDrop,
  handleDrag,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
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
          onChange={(e) => e.target.files && onFileSelect(e.target.files)}
          disabled={uploading}
        />
        <Button
          type="button"
          onClick={handleFileButtonClick}
          disabled={uploading}
          className="mt-2"
        >
          <Plus className="h-4 w-4 mr-2" />
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
  );
};

export default UploadArea;
