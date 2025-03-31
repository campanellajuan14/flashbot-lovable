
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Conversation } from "@/hooks/useConversationsData";
import { Chatbot } from "@/pages/chatbots/types";

export interface Message {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
  metadata: any;
}

export function useConversationDetails(conversationId?: string) {
  const { user } = useAuth();

  // Fetch conversation details
  const {
    data: conversation,
    isLoading: isLoadingConversation,
    error: conversationError,
  } = useQuery({
    queryKey: ["conversation-detail", conversationId],
    queryFn: async () => {
      if (!user || !conversationId) return null;

      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

      if (error) throw error;
      
      return data as Conversation;
    },
    enabled: !!user && !!conversationId,
  });

  // Fetch chatbot information once we have the conversation
  const {
    data: chatbot,
    isLoading: isLoadingChatbot,
    error: chatbotError,
  } = useQuery({
    queryKey: ["conversation-chatbot", conversation?.chatbot_id],
    queryFn: async () => {
      if (!user || !conversation) return null;

      const { data, error } = await supabase
        .from("chatbots")
        .select("*")
        .eq("id", conversation.chatbot_id)
        .single();

      if (error) throw error;
      
      // Cast the data to Chatbot type
      return data as unknown as Chatbot;
    },
    enabled: !!user && !!conversation?.chatbot_id,
  });

  // Fetch messages for the conversation
  const {
    data: messages,
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useQuery({
    queryKey: ["conversation-messages", conversationId],
    queryFn: async () => {
      if (!user || !conversationId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      return data as Message[];
    },
    enabled: !!user && !!conversationId,
  });

  const isLoading = isLoadingConversation || isLoadingMessages || isLoadingChatbot;
  const error = conversationError || messagesError || chatbotError;

  return {
    conversation,
    chatbot,
    messages,
    isLoading,
    error,
  };
}
