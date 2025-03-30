
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage, Chatbot } from "./types";

export const useChatMessages = (chatbot: Chatbot | undefined) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showSourceDetails, setShowSourceDetails] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    if (messages.length === 0 && chatbot) {
      const initialGreeting = chatbot.behavior?.greeting || `¡Hola! Soy un asistente virtual. ¿En qué puedo ayudarte hoy?`;
      handleBotResponse(initialGreeting);
    }
  }, [messages, chatbot]);

  const callClaudeAPI = async (messageHistory: ChatMessage[]) => {
    if (!chatbot) return null;
    
    try {
      console.log("Llamando a la API de Claude con:", messageHistory.length, "mensajes");
      
      const formattedMessages = messageHistory.map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      }));
      
      const response = await supabase.functions.invoke('claude-chat', {
        body: {
          messages: formattedMessages,
          behavior: chatbot.behavior,
          chatbotName: chatbot.name,
          settings: {
            ...chatbot.settings,
            includeReferences: true
          },
          chatbotId: chatbot.id
        }
      });
      
      if (response.error) {
        console.error("Error llamando a la API de Claude:", response.error);
        toast({
          title: "Error",
          description: "No se pudo conectar con el asistente IA",
          variant: "destructive"
        });
        return null;
      }
      
      console.log("Respuesta recibida de la API:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error llamando a la API de Claude:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar tu mensaje",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRef.current || !chatbot) return;
    
    const message = inputRef.current.value;
    if (!message.trim() || isTyping) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    // Clear the input field
    inputRef.current.value = "";
    
    setIsTyping(true);
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    try {
      const updatedMessages = [...messages, userMessage];
      
      const apiResponse = await callClaudeAPI(updatedMessages);
      
      if (apiResponse) {
        const { message: responseText, references } = apiResponse;
        handleBotResponse(responseText, references);
      } else {
        handleBotResponse("Lo siento, estoy teniendo problemas para responder. Por favor, inténtalo de nuevo más tarde.");
      }
    } catch (error) {
      console.error("Error procesando el mensaje:", error);
      handleBotResponse("Ha ocurrido un error al procesar tu mensaje. Por favor, inténtalo de nuevo.");
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleBotResponse = (content: string, references?: any[]) => {
    const botMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "bot",
      content,
      timestamp: new Date(),
      references,
    };
    
    setMessages(prev => [...prev, botMessage]);
  };

  const toggleSourceDetails = (messageId: string) => {
    setShowSourceDetails(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  return {
    messages,
    isTyping,
    messagesEndRef,
    inputRef,
    showSourceDetails,
    handleSendMessage,
    toggleSourceDetails
  };
};
