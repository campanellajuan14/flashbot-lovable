
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
  
  return {
    metricsData,
    countData,
    isLoading,
    metricsError
  };
}
