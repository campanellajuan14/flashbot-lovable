
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Chatbot } from "./types";

export const useChatbotData = () => {
  const { id } = useParams<{ id: string }>();
  
  const { data: chatbot, isLoading, isError } = useQuery({
    queryKey: ['chatbot', id],
    queryFn: async () => {
      if (!id) throw new Error("Se requiere ID del chatbot");
      
      console.log("Fetching chatbot with ID:", id);
      
      const { data, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error("Error fetching chatbot:", error);
        throw error;
      }
      
      console.log("Fetched chatbot:", data);
      return data as unknown as Chatbot;
    },
    retry: 1,
  });

  return {
    chatbot,
    isLoading,
    isError,
    id
  };
};
