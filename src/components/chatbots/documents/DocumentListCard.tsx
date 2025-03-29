
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUp, FileText, Trash2 } from "lucide-react";
import { Document } from "@/pages/chatbots/ChatbotDocuments";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import SampleDocumentDownload from "./SampleDocumentDownload";

interface DocumentListCardProps {
  documents?: Document[];
  isLoading?: boolean;
  chatbotId: string;
  onUploadClick: () => void;
}

const DocumentListCard: React.FC<DocumentListCardProps> = ({
  documents,
  isLoading,
  chatbotId,
  onUploadClick,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (error) throw error;

      // Refresh documents list
      queryClient.invalidateQueries({ queryKey: ["chatbot-documents", chatbotId] });

      toast({
        title: "Document deleted",
        description: "Document has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Could not delete document. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Knowledge Base Documents
          </span>
          <Button onClick={onUploadClick} variant="outline" size="sm" className="gap-1">
            <FileUp className="h-4 w-4" /> Upload
          </Button>
        </CardTitle>
        <CardDescription>Documents used to provide context to your chatbot</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        ) : !documents || documents.length === 0 ? (
          <div className="space-y-4">
            <SampleDocumentDownload />
            
            <div className="text-center p-8 border border-dashed rounded-lg">
              <p className="text-muted-foreground mb-4">
                No documents have been uploaded yet
              </p>
              <Button onClick={onUploadClick} variant="secondary">
                <FileUp className="h-4 w-4 mr-2" /> Upload documents
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <SampleDocumentDownload />
            
            <div className="border rounded-md divide-y">
              {documents.map((doc) => (
                <div key={doc.id} className="p-3 flex justify-between items-center">
                  <div className="flex items-start gap-3 overflow-hidden">
                    <FileText className="h-5 w-5 text-primary shrink-0 mt-1" />
                    <div className="overflow-hidden">
                      <p className="font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(doc.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentListCard;
