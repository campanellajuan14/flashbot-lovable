
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface MetricsData {
  id: string;
  chatbot_id: string;
  precision: number;
  response_time: number;
  tokens_used: number;
  created_at: string;
  chatbots: {
    name: string;
    user_id: string;
  };
}

export interface CountData {
  chatbots: number;
  conversations: number;
  documents: number;
  messages: number;
}

export function useAnalyticsData() {
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
      
      try {
        // Get chatbot count for current user
        const { count: chatbotCount, error: chatbotError } = await supabase
          .from("chatbots")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        
        if (chatbotError) throw chatbotError;
        
        console.log("Chatbot count:", chatbotCount);
        
        // Get user's chatbot IDs to filter related data
        const { data: userChatbots, error: chatbotListError } = await supabase
          .from("chatbots")
          .select("id")
          .eq("user_id", user.id);
        
        if (chatbotListError) throw chatbotListError;
        
        const chatbotIds = userChatbots?.map(c => c.id) || [];
        
        // Safety check - if no chatbots, use a value that will return no results
        if (chatbotIds.length === 0) {
          console.log("No chatbot IDs found, returning zeros");
          return {
            chatbots: chatbotCount || 0,
            conversations: 0,
            documents: 0,
            messages: 0
          };
        }
        
        // Get conversation count for user's chatbots
        const { count: conversationCount, error: convError } = await supabase
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .in("chatbot_id", chatbotIds);
        
        if (convError) throw convError;
        
        console.log("Conversation count:", conversationCount);
        
        // Get document count for user's chatbots
        const { count: documentCount, error: docError } = await supabase
          .from("documents")
          .select("id", { count: "exact", head: true })
          .in("chatbot_id", chatbotIds);
        
        if (docError) throw docError;
        
        console.log("Document count:", documentCount);
        
        // Get message count by finding conversations first, then counting messages
        let messageCount = 0;
        
        if (conversationCount && conversationCount > 0) {
          const { data: conversationIds, error: convListError } = await supabase
            .from("conversations")
            .select("id")
            .in("chatbot_id", chatbotIds);
          
          if (convListError) throw convListError;
          
          if (conversationIds && conversationIds.length > 0) {
            const convIds = conversationIds.map(c => c.id);
            
            const { count: msgCount, error: msgError } = await supabase
              .from("messages")
              .select("id", { count: "exact", head: true })
              .in("conversation_id", convIds);
            
            if (msgError) throw msgError;
            messageCount = msgCount || 0;
          }
        }
        
        console.log("Message count:", messageCount);
        
        return {
          chatbots: chatbotCount || 0,
          conversations: conversationCount || 0,
          documents: documentCount || 0,
          messages: messageCount || 0
        };
      } catch (error) {
        console.error("Error fetching analytics counts:", error);
        throw error;
      }
    },
    enabled: !!user, // Only run query when user is authenticated
    retry: 1, // Limit retries on error
    staleTime: 30000 // Consider data fresh for 30 seconds
  });
  
  const isLoading = isLoadingMetrics || isLoadingCounts;
  
  return {
    metricsData,
    countData,
    isLoading,
    metricsError
  };
}
