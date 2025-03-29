
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CloudUpload, FileText } from "lucide-react";
import DocumentUploadCard from "@/components/chatbots/documents/DocumentUploadCard";
import { ChatbotFormData } from "../types";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";

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
  const [tempDocuments, setTempDocuments] = useState<any[]>([]);
  
  // Use a temporary ID for the chatbot if we're creating a new one
  const [tempChatbotId] = useState(() => chatbotId || `temp-${uuidv4()}`);
  
  // Fetch temporary documents when mounting or after an upload
  const fetchTempDocuments = async () => {
    if (tempChatbotId.startsWith('temp-')) {
      try {
        const { data, error } = await supabase.functions.invoke('kv-get-documents-by-chatbot', {
          body: {
            tempChatbotId
          }
        });
        
        if (error) {
          console.error("Error fetching temporary documents:", error);
          return;
        }
        
        if (data && Array.isArray(data.documents)) {
          setTempDocuments(data.documents);
          console.log(`Found ${data.documents.length} temporary documents`);
        }
      } catch (error) {
        console.error("Error fetching temporary documents:", error);
      }
    }
  };

  // Fetch temp documents on mount
  useEffect(() => {
    fetchTempDocuments();
  }, [tempChatbotId]);

  const handleDocumentUploadComplete = () => {
    toast({
      title: "Documentos procesados",
      description: "Los documentos han sido procesados exitosamente.",
    });
    
    // Refresh the documents list
    fetchTempDocuments();
    
    // Only invalidate queries if we have a real chatbot ID
    if (chatbotId && !chatbotId.startsWith('temp-')) {
      queryClient.invalidateQueries({ queryKey: ["chatbot-documents", chatbotId] });
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
            <DocumentUploadCard
              chatbotId={tempChatbotId}
              userId={userId}
              retrievalSettings={{
                chunk_size: 1000,
                chunk_overlap: 200,
                embedding_model: "text-embedding-ada-002"
              }}
              onUploadComplete={handleDocumentUploadComplete}
            />
            
            {/* Mostrar documentos temporales */}
            {tempDocuments.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Documentos subidos ({tempDocuments.length})</h3>
                <div className="border rounded-md divide-y">
                  {tempDocuments.map((doc, index) => (
                    <div key={index} className="p-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{doc.name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Estos documentos serán procesados cuando guardes el chatbot.
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
