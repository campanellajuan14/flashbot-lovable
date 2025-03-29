
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
import { useAuth } from "@/hooks/useAuth";

const AnalyticsPage = () => {
  const { user } = useAuth();
  
  // Fetch metrics data for the current user's chatbots only
  const { data: metricsData, isLoading: isLoadingMetrics, error: metricsError } = useQuery({
    queryKey: ["retrieval-metrics", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // First, get the user's chatbots
      const { data: userChatbots, error: chatbotError } = await supabase
        .from("chatbots")
        .select("id")
        .eq("user_id", user.id);
      
      if (chatbotError) throw chatbotError;
      
      // If user has no chatbots, return empty array
      if (!userChatbots || userChatbots.length === 0) {
        console.log("User has no chatbots");
        return [];
      }
      
      const chatbotIds = userChatbots.map(c => c.id);
      
      // Get metrics for those chatbots
      const { data, error } = await supabase
        .from("retrieval_metrics")
        .select(`
          id,
          chatbot_id,
          precision,
          response_time,
          tokens_used,
          created_at,
          chatbots(name, user_id)
        `)
        .in("chatbot_id", chatbotIds)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      console.log("Retrieved metrics:", data?.length || 0);
      return data || [];
    },
    enabled: !!user, // Only run query when user is authenticated
  });

  // Fetch total counts from database for current user only
  const { data: countData, isLoading: isLoadingCounts } = useQuery({
    queryKey: ["analytics-counts", user?.id],
    queryFn: async () => {
      if (!user) return { chatbots: 0, conversations: 0, documents: 0, messages: 0 };
      
      // Get chatbot count for current user
      const { count: chatbotCount, error: chatbotError } = await supabase
        .from("chatbots")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      
      if (chatbotError) throw chatbotError;
      
      console.log("Chatbot count:", chatbotCount);
      
      // If user has no chatbots, return zeros
      if (!chatbotCount) {
        return {
          chatbots: 0,
          conversations: 0,
          documents: 0,
          messages: 0
        };
      }
      
      // Get user's chatbot IDs to filter related data
      const { data: userChatbots, error: chatbotListError } = await supabase
        .from("chatbots")
        .select("id")
        .eq("user_id", user.id);
      
      if (chatbotListError) throw chatbotListError;
      
      const chatbotIds = userChatbots?.map(c => c.id) || [];
      
      // Safety check - if no chatbots, use a value that will return no results
      // rather than causing an error
      const validChatbotIds = chatbotIds.length > 0 ? chatbotIds : [null];
      
      // Get conversation count for user's chatbots
      const { count: conversationCount, error: convError } = await supabase
        .from("conversations")
        .select("*", { count: "exact", head: true })
        .in("chatbot_id", validChatbotIds);
      
      if (convError) throw convError;
      
      console.log("Conversation count:", conversationCount);
      
      // Get document count for user's chatbots
      const { count: documentCount, error: docError } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .in("chatbot_id", validChatbotIds);
      
      if (docError) throw docError;
      
      console.log("Document count:", documentCount);
      
      // Get conversation IDs for messages count
      const { data: userConversations, error: convListError } = await supabase
        .from("conversations")
        .select("id")
        .in("chatbot_id", validChatbotIds);
      
      if (convListError) throw convListError;
      
      // If no conversations, return known counts with 0 messages
      if (!userConversations || userConversations.length === 0) {
        return {
          chatbots: chatbotCount || 0,
          conversations: conversationCount || 0,
          documents: documentCount || 0,
          messages: 0
        };
      }
      
      const conversationIds = userConversations.map(c => c.id);
      const validConversationIds = conversationIds.length > 0 ? conversationIds : [null];
      
      const { count: messageCount, error: msgError } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", validConversationIds);
      
      if (msgError) throw msgError;
      
      console.log("Message count:", messageCount);
      
      return {
        chatbots: chatbotCount || 0,
        conversations: conversationCount || 0,
        documents: documentCount || 0,
        messages: messageCount || 0
      };
    },
    enabled: !!user, // Only run query when user is authenticated
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
