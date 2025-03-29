
import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileText, Plus } from "lucide-react";
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

const DocumentsPage = () => {
  const { user } = useAuth();
  
  // Obtener todos los chatbots del usuario
  const { data: chatbots, isLoading: isLoadingChatbots } = useQuery({
    queryKey: ["user-chatbots"],
    queryFn: async () => {
      if (!user) throw new Error("Usuario no autenticado");
      
      const { data, error } = await supabase
        .from("chatbots")
        .select("id, name, description, created_at")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
  
  // Obtener conteo de documentos por chatbot
  const { data: documentCounts, isLoading: isLoadingCounts } = useQuery({
    queryKey: ["document-counts"],
    queryFn: async () => {
      if (!user) throw new Error("Usuario no autenticado");
      
      const { data, error } = await supabase
        .from("documents")
        .select("chatbot_id, count")
        .eq("user_id", user.id)
        .select("chatbot_id, count(*)", { count: "exact" })
        .group("chatbot_id");
      
      if (error) throw error;
      
      // Convertir a objeto para fácil acceso
      const counts: Record<string, number> = {};
      data.forEach((item) => {
        counts[item.chatbot_id] = item.count;
      });
      
      return counts;
    },
    enabled: !!user,
  });
  
  const isLoading = isLoadingChatbots || isLoadingCounts;
  
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
          <div className="flex justify-center items-center h-60">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        ) : chatbots && chatbots.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {chatbots.map((chatbot) => (
              <Card key={chatbot.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="truncate">{chatbot.name}</CardTitle>
                  <CardDescription className="truncate">
                    {chatbot.description || "Sin descripción"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm">
                        {documentCounts?.[chatbot.id] || 0} documentos
                      </span>
                    </div>
                    <Button asChild size="sm">
                      <Link to={`/chatbots/${chatbot.id}/documents`}>
                        Administrar
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>No hay chatbots</CardTitle>
              <CardDescription>
                Crea un chatbot para añadir documentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/chatbots/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear chatbot
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
