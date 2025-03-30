
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Separator } from "@/components/ui/separator";
import { useConversationsData } from "@/hooks/useConversationsData";
import ConversationsTable from "@/components/conversations/ConversationsTable";
import ConversationsFilters from "@/components/conversations/ConversationsFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Rename this interface to avoid conflict with component name
interface ConversationsFilterState {
  chatbotId: string | undefined;
  dateRange: { from: Date | undefined; to: Date | undefined };
}

const ConversationsPage = () => {
  const [filters, setFilters] = useState<ConversationsFilterState>({
    chatbotId: undefined,
    dateRange: { from: undefined, to: undefined }
  });
  
  const { conversations, chatbots, isLoading, error, refetch } = useConversationsData(filters);

  // Handle filter changes
  const handleChatbotFilterChange = (chatbotId: string | undefined) => {
    setFilters(prev => ({ ...prev, chatbotId }));
  };
  
  const handleDateRangeChange = (dateRange: { from: Date | undefined; to: Date | undefined }) => {
    setFilters(prev => ({ ...prev, dateRange }));
  };

  useEffect(() => {
    if (error) {
      toast.error("Error al cargar las conversaciones");
      console.error("Error cargando conversaciones:", error);
    }
  }, [error]);
  
  // Debug
  useEffect(() => {
    console.log("Current filters:", filters);
    console.log("Conversations data:", conversations);
    console.log("Chatbots data:", chatbots);
  }, [filters, conversations, chatbots]);
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conversaciones</h1>
          <p className="text-muted-foreground mt-1">
            Visualiza y analiza las conversaciones de tus chatbots con los usuarios
          </p>
        </div>

        <Separator />
        
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              No se pudieron cargar las conversaciones. Por favor, intenta de nuevo más tarde.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-80 w-full" />
              </div>
            ) : (
              <>
                <ConversationsFilters 
                  chatbots={chatbots || []} 
                  selectedChatbotId={filters.chatbotId}
                  onChatbotChange={handleChatbotFilterChange}
                  dateRange={filters.dateRange || { from: undefined, to: undefined }}
                  onDateRangeChange={handleDateRangeChange}
                />
                
                {chatbots && chatbots.length === 0 ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Información</AlertTitle>
                    <AlertDescription>
                      No tienes chatbots creados. Crea un chatbot primero para ver conversaciones.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <ConversationsTable 
                    conversations={conversations || []} 
                    isLoading={isLoading}
                    chatbots={chatbots || []}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ConversationsPage;
