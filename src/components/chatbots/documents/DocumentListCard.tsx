
import React from "react";
import { 
  Button, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  useToast
} from "@/components/ui";
import { File, FileText, Trash2, Plus, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DocumentMetadata {
  type?: string;
  source?: string;
  size?: number;
  isChunk?: boolean;
  parentId?: string;
  recordId?: string;
  chunkIndex?: number;
  totalChunks?: number;
  recordRange?: {
    start?: number;
    end?: number;
  };
  [key: string]: any;
}

interface Document {
  id: string;
  name: string;
  content: string;
  created_at: string;
  chatbot_id: string;
  metadata: DocumentMetadata;
  user_id?: string;
}

interface DocumentListCardProps {
  chatbotId: string;
  documents: Document[] | undefined;
  isLoading: boolean;
  onUploadClick: () => void;
}

const DocumentListCard = ({
  chatbotId,
  documents,
  isLoading,
  onUploadClick
}: DocumentListCardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);
      
      if (error) throw error;
      return documentId;
    },
    onSuccess: () => {
      toast({
        title: "Documento eliminado",
        description: "El documento ha sido eliminado correctamente.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['chatbot-documents', chatbotId] });
    },
    onError: (error) => {
      console.error("Error al eliminar documento:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el documento. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteDocument = (documentId: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer.")) {
      deleteDocumentMutation.mutate(documentId);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Documentos subidos</CardTitle>
        <CardDescription>
          {isLoading ? (
            "Cargando documentos..."
          ) : documents && documents.length > 0 ? (
            `${documents.length} documento(s) subido(s)`
          ) : (
            "No hay documentos subidos"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : documents && documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div 
                key={doc.id} 
                className="flex items-center justify-between p-3 rounded-md border"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    {doc.metadata?.type?.includes('pdf') ? (
                      <FileText className="h-5 w-5 text-primary" />
                    ) : doc.metadata?.type?.includes('csv') ? (
                      <FileText className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <File className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">{doc.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString()} - 
                      {doc.metadata?.source && ` Fuente: ${doc.metadata.source}`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteDocument(doc.id)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border rounded-md bg-muted/30">
            <FileText className="h-10 w-10 mb-2 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-medium">No hay documentos</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sube documentos para que tu chatbot pueda responder preguntas basadas en ellos.
            </p>
            <Button onClick={onUploadClick}>
              <Plus className="h-4 w-4 mr-2" />
              Añadir documento
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentListCard;
