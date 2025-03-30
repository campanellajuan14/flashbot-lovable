
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useConversationDetails } from "@/hooks/useConversationDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import ConversationMessages from "@/components/conversations/ConversationMessages";
import ConversationHeader from "@/components/conversations/ConversationHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const ConversationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { 
    conversation, 
    messages, 
    chatbot,
    isLoading, 
    error 
  } = useConversationDetails(id);

  useEffect(() => {
    if (error) {
      toast.error("Error al cargar los detalles de la conversación");
      console.error("Error cargando detalles:", error);
    }
  }, [error]);

  const handleBack = () => {
    navigate("/conversations");
  };

  if (!id) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              ID de conversación no válido
            </AlertDescription>
          </Alert>
          <Button onClick={handleBack} className="mt-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Volver a conversaciones
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={handleBack} className="mr-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Detalles de la conversación</h1>
          </div>
        </div>

        <Separator />
        
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              No se pudieron cargar los detalles de la conversación. Por favor, intenta de nuevo más tarde.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {conversation && chatbot && (
                  <>
                    <ConversationHeader 
                      conversation={conversation}
                      chatbot={chatbot}
                    />
                    
                    <ConversationMessages 
                      messages={messages || []}
                    />
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ConversationDetailPage;
