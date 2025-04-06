
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import ChatbotDetails from "./components/detail/ChatbotDetails";

const ChatbotDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const {
    data: chatbot,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["chatbot", id],
    queryFn: async () => {
      if (!id) throw new Error("Chatbot ID is required");
      
      const { data, error } = await supabase
        .from("chatbots")
        .select("*")
        .eq("id", id)
        .eq("user_id", user?.id)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user?.id,
  });

  const handleBack = () => {
    navigate("/chatbots");
  };

  const handleEdit = () => {
    navigate(`/chatbots/${id}/edit`);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex-1 items-center justify-center flex">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !chatbot) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <h2 className="text-xl font-medium text-destructive mb-2">Error</h2>
          <p className="text-destructive/80">
            No se pudo cargar el chatbot. El chatbot no existe o no tienes permiso para verlo.
          </p>
          <Button className="mt-4" onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la lista de chatbots
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Button onClick={handleBack} variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{chatbot.name}</h1>
                <Badge variant={chatbot.is_active ? "default" : "outline"}>
                  {chatbot.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              {chatbot.description && (
                <p className="text-muted-foreground mt-1">{chatbot.description}</p>
              )}
            </div>
            <Button onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit chatbot
            </Button>
          </div>
        </div>

        <ChatbotDetails chatbot={chatbot} />
      </div>
    </DashboardLayout>
  );
};

export default ChatbotDetail;
