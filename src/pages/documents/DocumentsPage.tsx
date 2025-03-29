import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileText, Plus, ExternalLink } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Document {
  id: string;
  name: string;
  chatbot_id: string;
  created_at: string;
  chatbot_name: string;
  metadata: {
    type?: string;
    source?: string;
    size?: number;
    isChunk?: boolean;
    parentId?: string;
  };
}

const DocumentsPage = () => {
  const { user } = useAuth();
  
  const { data: documents, isLoading } = useQuery({
    queryKey: ["user-documents"],
    queryFn: async () => {
      if (!user) throw new Error("Usuario no autenticado");
      
      const { data, error } = await supabase
        .from("documents")
        .select(`
          id, 
          name, 
          chatbot_id, 
          created_at, 
          metadata,
          chatbots(name)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      return data.map(doc => ({
        id: doc.id,
        name: doc.name,
        chatbot_id: doc.chatbot_id,
        created_at: doc.created_at,
        chatbot_name: doc.chatbots?.name || "Chatbot desconocido",
        metadata: doc.metadata || {}
      })) as Document[];
    },
    enabled: !!user,
  });
  
  const documentsByChatbot = React.useMemo(() => {
    if (!documents) return {};
    
    return documents.reduce((acc: Record<string, Document[]>, document) => {
      if (!acc[document.chatbot_id]) {
        acc[document.chatbot_id] = [];
      }
      acc[document.chatbot_id].push(document);
      return acc;
    }, {});
  }, [documents]);
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
            <p className="text-muted-foreground">
              Administra los documentos de tus chatbots
            </p>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : documents && documents.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(documentsByChatbot).map(([chatbotId, chatbotDocuments]) => (
              <Card key={chatbotId} className="overflow-hidden">
                <CardHeader className="pb-3 bg-accent/30">
                  <div className="flex justify-between items-center">
                    <CardTitle className="truncate">
                      {chatbotDocuments[0].chatbot_name}
                    </CardTitle>
                    <Button asChild size="sm" variant="secondary">
                      <Link to={`/chatbots/${chatbotId}/documents`}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Administrar
                      </Link>
                    </Button>
                  </div>
                  <CardDescription>
                    {chatbotDocuments.length} documento(s)
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {chatbotDocuments.map((doc) => (
                      <div key={doc.id} className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium truncate max-w-md">{doc.name}</h3>
                            <div className="flex gap-2 mt-1">
                              {doc.metadata?.type && (
                                <Badge variant="outline">
                                  {doc.metadata.type}
                                </Badge>
                              )}
                              {doc.metadata?.isChunk && (
                                <Badge variant="outline" className="bg-blue-50">
                                  Fragmento
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>No hay documentos</CardTitle>
              <CardDescription>
                Sube documentos a tus chatbots para mejorar sus respuestas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/chatbots">
                  <Plus className="mr-2 h-4 w-4" />
                  Ir a tus chatbots
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DocumentsPage;
