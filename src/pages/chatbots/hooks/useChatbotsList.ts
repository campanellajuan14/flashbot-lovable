import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Chatbot, ChatbotWithDocuments } from "../types";

export const useChatbotsList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: chatbots, isLoading, isError, refetch } = useQuery({
    queryKey: ['chatbots', user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      console.log("Fetching chatbots for user:", user.id);
      
      const { data, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error("Error fetching chatbots:", error);
        throw error;
      }
      
      console.log("Fetched chatbots:", data);
      return data as unknown as Chatbot[];
    },
    enabled: !!user,
  });

  const { data: chatbotsWithDocuments, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['chatbots-with-documents', chatbots],
    queryFn: async () => {
      if (!chatbots || chatbots.length === 0) return [];
      
      const enhancedChatbots: ChatbotWithDocuments[] = await Promise.all(
        chatbots.map(async (chatbot) => {
          const { count, error } = await supabase
            .from('documents')
            .select('id', { count: 'exact' })
            .eq('chatbot_id', chatbot.id);
          
          return {
            ...chatbot,
            document_count: count || 0
          } as ChatbotWithDocuments;
        })
      );
      
      return enhancedChatbots;
    },
    enabled: !!chatbots && chatbots.length > 0,
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Chatbot ID copied to clipboard",
      });
    } catch (err) {
      console.error("Copy failed: ", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this chatbot?")) {
      try {
        const { error } = await supabase
          .from('chatbots')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        toast({
          title: "Chatbot deleted",
          description: "The chatbot has been successfully deleted",
        });
        
        refetch();
      } catch (err) {
        console.error("Error deleting chatbot:", err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not delete the chatbot",
        });
      }
    }
  };

  const filteredChatbots = chatbotsWithDocuments?.filter(chatbot => 
    chatbot.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (chatbot.description && chatbot.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  return {
    searchQuery,
    setSearchQuery,
    chatbots,
    chatbotsWithDocuments,
    filteredChatbots,
    isLoading,
    isLoadingDocuments,
    isError,
    refetch,
    copyToClipboard,
    handleDelete,
    user
  };
};
