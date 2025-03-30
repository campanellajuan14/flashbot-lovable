
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Chatbot } from "./types";
import { useToast } from "@/hooks/use-toast";

export const useChatbotData = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
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
        
        // Mostrar toast con el error específico para ayudar en el diagnóstico
        toast({
          title: "Error al cargar el chatbot",
          description: `${error.message} (${error.code})`,
          variant: "destructive",
        });
        
        throw error;
      }
      
      if (!data) {
        console.error("No se encontró el chatbot con ID:", id);
        toast({
          title: "Chatbot no encontrado",
          description: "No se pudo encontrar el chatbot con el ID proporcionado",
          variant: "destructive",
        });
        throw new Error("Chatbot no encontrado");
      }
      
      console.log("Fetched chatbot:", data);
      return data as Chatbot;
    },
    retry: 1,
    staleTime: 30000, // Mantener los datos frescos por 30 segundos
  });

  return {
    chatbot,
    isLoading,
    isError,
    id
  };
};
