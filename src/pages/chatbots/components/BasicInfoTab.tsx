
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CloudUpload } from "lucide-react";
import DocumentUploadCard from "@/components/chatbots/documents/DocumentUploadCard";
import { ChatbotFormData } from "../types";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

interface BasicInfoTabProps {
  form: ChatbotFormData;
  handleChange: (field: string, value: any) => void;
  chatbotId?: string;
  userId?: string;
}

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({ 
  form, 
  handleChange, 
  chatbotId, 
  userId 
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDocumentUploadComplete = () => {
    if (chatbotId) {
      // Refresh documents list after upload
      queryClient.invalidateQueries({ queryKey: ["chatbot-documents", chatbotId] });
      
      toast({
        title: "Documentos procesados",
        description: "Los documentos han sido procesados exitosamente.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
          <CardDescription>
            Configura el nombre y descripción para tu chatbot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              placeholder="ej., Asistente de Soporte al Cliente"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Un nombre claro y descriptivo para tu chatbot
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="¿Qué hace este chatbot?"
              rows={3}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Una breve descripción del propósito y capacidades del chatbot
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={form.isActive}
              onCheckedChange={(checked) => handleChange("isActive", checked)}
            />
            <Label htmlFor="active">Activo</Label>
          </div>
        </CardContent>
      </Card>

      {userId && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <CloudUpload className="h-5 w-5 text-primary" />
              Base de Conocimiento
            </CardTitle>
            <CardDescription>
              Sube documentos para entrenar a tu chatbot y mejorar sus respuestas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chatbotId ? (
              <DocumentUploadCard
                chatbotId={chatbotId}
                userId={userId}
                retrievalSettings={{
                  chunk_size: 1000,
                  chunk_overlap: 200,
                  embedding_model: "text-embedding-ada-002"
                }}
                onUploadComplete={handleDocumentUploadComplete}
              />
            ) : (
              <div className="p-6 text-center border-2 border-dashed rounded-lg border-muted-foreground/20">
                <CloudUpload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="mb-1 font-medium">Documentos disponibles después de crear el chatbot</h3>
                <p className="text-sm text-muted-foreground">
                  Podrás subir documentos después de guardar el chatbot por primera vez
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BasicInfoTab;
