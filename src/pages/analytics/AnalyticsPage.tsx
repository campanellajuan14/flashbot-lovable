
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AnalyticsSummary from "@/components/analytics/AnalyticsSummary";
import PerformanceMetrics from "@/components/analytics/PerformanceMetrics";
import UsageChart from "@/components/analytics/UsageChart";
import TopChatbots from "@/components/analytics/TopChatbots";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AnalyticsPage = () => {
  // Fetch all metrics data for the user's chatbots
  const { data: metricsData, isLoading: isLoadingMetrics, error: metricsError } = useQuery({
    queryKey: ["retrieval-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("retrieval_metrics")
        .select(`
          id,
          chatbot_id,
          precision,
          response_time,
          tokens_used,
          created_at,
          chatbots(name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch total counts from database
  const { data: countData, isLoading: isLoadingCounts } = useQuery({
    queryKey: ["analytics-counts"],
    queryFn: async () => {
      // Get chatbot count
      const { count: chatbotCount, error: chatbotError } = await supabase
        .from("chatbots")
        .select("*", { count: "exact", head: true });
      
      if (chatbotError) throw chatbotError;
      
      // Get conversation count
      const { count: conversationCount, error: convError } = await supabase
        .from("conversations")
        .select("*", { count: "exact", head: true });
      
      if (convError) throw convError;
      
      // Get document count
      const { count: documentCount, error: docError } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true });
      
      if (docError) throw docError;
      
      // Get message count
      const { count: messageCount, error: msgError } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true });
      
      if (msgError) throw msgError;
      
      return {
        chatbots: chatbotCount || 0,
        conversations: conversationCount || 0,
        documents: documentCount || 0,
        messages: messageCount || 0
      };
    },
  });
  
  const isLoading = isLoadingMetrics || isLoadingCounts;
  
  if (metricsError) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              No se pudieron cargar los datos de análisis. Por favor, inténtalo de nuevo más tarde.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analíticas</h1>
          <p className="text-muted-foreground mt-1">
            Supervisa el rendimiento y uso de tus chatbots
          </p>
        </div>

        <Separator />
        
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : (
          <AnalyticsSummary data={countData} />
        )}

        <Tabs defaultValue="performance" className="w-full">
          <TabsList>
            <TabsTrigger value="performance">Rendimiento</TabsTrigger>
            <TabsTrigger value="usage">Uso</TabsTrigger>
            <TabsTrigger value="chatbots">Chatbots</TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance" className="space-y-4">
            <PerformanceMetrics data={metricsData} isLoading={isLoading} />
          </TabsContent>
          
          <TabsContent value="usage" className="space-y-4">
            <UsageChart data={metricsData} isLoading={isLoading} />
          </TabsContent>
          
          <TabsContent value="chatbots" className="space-y-4">
            <TopChatbots data={metricsData} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
