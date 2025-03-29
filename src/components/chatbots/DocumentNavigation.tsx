
import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface DocumentNavigationProps {
  chatbotId: string;
}

const DocumentNavigation: React.FC<DocumentNavigationProps> = ({ chatbotId }) => {
  // Obtener el conteo de documentos para este chatbot
  const { data: documentCount, isLoading } = useQuery({
    queryKey: ["chatbot-documents-count", chatbotId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("chatbot_id", chatbotId);
      
      if (error) throw error;
      return count || 0;
    },
  });

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-accent/10">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-medium">Documentos</h3>
          {isLoading ? (
            <Skeleton className="h-4 w-40 mt-1" />
          ) : (
            <p className="text-sm text-muted-foreground">
              {documentCount ? `${documentCount} documento(s) subido(s)` : "Sin documentos. Añade para mejorar las respuestas"}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {documentCount === 0 && (
          <Button asChild size="sm" variant="outline">
            <Link to={`/chatbots/${chatbotId}/documents`}>
              <Plus className="mr-2 h-4 w-4" />
              Añadir
            </Link>
          </Button>
        )}
        <Button asChild size="sm" variant={documentCount ? "default" : "secondary"}>
          <Link to={`/chatbots/${chatbotId}/documents`}>
            Administrar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default DocumentNavigation;
