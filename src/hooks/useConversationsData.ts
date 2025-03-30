import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Chatbot } from "@/pages/chatbots/types";

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  chatbot_id: string;
  user_identifier: string | null;
  metadata: any;
  message_count?: number;
  latest_message?: string;
}

export interface ConversationsFilters {
  chatbotId?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}

export function useConversationsData(filters?: ConversationsFilters) {
  const { user } = useAuth();
  const chatbotId = filters?.chatbotId;
  const dateFrom = filters?.dateRange?.from;
  const dateTo = filters?.dateRange?.to;

  // Fetch all chatbots owned by the user
  const {
    data: chatbots,
    isLoading: isLoadingChatbots,
    error: chatbotsError,
  } = useQuery({
    queryKey: ["user-chatbots", user?.id],
    queryFn: async () => {
      if (!user) return [];

      console.log("Fetching chatbots for user:", user.id);
      const { data, error } = await supabase
        .from("chatbots")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching chatbots:", error);
        throw error;
      }
      
      console.log("Found chatbots:", data?.length || 0);
      return data as Chatbot[];
    },
    enabled: !!user,
  });

  // Fetch conversations with message counts
  const {
    data: conversations,
    isLoading: isLoadingConversations,
    error: conversationsError,
    refetch,
  } = useQuery({
    queryKey: ["conversations", user?.id, chatbotId, dateFrom?.toISOString(), dateTo?.toISOString()],
    queryFn: async () => {
      if (!user) return [];

      try {
        // Wait for chatbots to be loaded first
        if (!chatbots) {
          console.log("Chatbots not loaded yet, waiting...");
          return [];
        }
        
        // Get the chatbot IDs for this user
        const chatbotIds = chatbots.map(c => c.id);
        console.log("User's chatbot IDs:", chatbotIds);
        
        if (chatbotIds.length === 0) {
          console.log("No chatbots found for this user");
          return [];
        }
        
        // Start building the query
        let query = supabase.from("conversations").select(`
          id,
          created_at,
          updated_at,
          chatbot_id,
          user_identifier,
          metadata
        `);
        
        // Apply chatbot filter if selected
        if (chatbotId) {
          console.log("Filtering by specific chatbot ID:", chatbotId);
          query = query.eq("chatbot_id", chatbotId);
        } else {
          // Otherwise filter for all user's chatbots
          console.log("Filtering by user's chatbot IDs:", chatbotIds);
          query = query.in("chatbot_id", chatbotIds);
        }

        // Apply date filters if provided
        if (dateFrom) {
          console.log("Filtering conversations from:", dateFrom.toISOString());
          query = query.gte('created_at', dateFrom.toISOString());
        }
        
        if (dateTo) {
          // Add one day to include the entire end date
          const nextDay = new Date(dateTo);
          nextDay.setDate(nextDay.getDate() + 1);
          console.log("Filtering conversations to:", nextDay.toISOString());
          query = query.lt('created_at', nextDay.toISOString());
        }
        
        // Order by most recent first
        const { data: conversationsData, error: conversationsError } = await query
          .order("updated_at", { ascending: false });

        if (conversationsError) {
          console.error("Error fetching conversations:", conversationsError);
          throw conversationsError;
        }

        // If there are no conversations, return empty array
        if (!conversationsData || conversationsData.length === 0) {
          console.log("No conversations found");
          return [];
        }

        console.log(`Found ${conversationsData.length} conversations`);

        // For each conversation, get the message count and most recent message
        const enrichedConversations = await Promise.all(
          conversationsData.map(async (conversation) => {
            // Get message count
            const { count, error: countError } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("conversation_id", conversation.id);

            if (countError) {
              console.error(`Error fetching count for conversation ${conversation.id}:`, countError);
              return { ...conversation, message_count: 0 };
            }
            
            // Get latest message
            const { data: latestMessageData, error: latestMessageError } = await supabase
              .from("messages")
              .select("content, role")
              .eq("conversation_id", conversation.id)
              .order("created_at", { ascending: false })
              .limit(1);

            if (latestMessageError) {
              console.error(`Error fetching latest message for conversation ${conversation.id}:`, latestMessageError);
              return { 
                ...conversation, 
                message_count: count || 0,
                latest_message: null
              };
            }

            const latestMessage = latestMessageData && latestMessageData.length > 0 
              ? latestMessageData[0] 
              : null;

            return {
              ...conversation,
              message_count: count || 0,
              latest_message: latestMessage ? latestMessage.content : null
            };
          })
        );

        return enrichedConversations as Conversation[];
      } catch (error) {
        console.error("Error in conversations query:", error);
        throw error;
      }
    },
    enabled: !!user && !!chatbots,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  const isLoading = isLoadingChatbots || isLoadingConversations;
  const error = chatbotsError || conversationsError;

  return {
    conversations,
    chatbots,
    isLoading,
    error,
    refetch
  };
}
