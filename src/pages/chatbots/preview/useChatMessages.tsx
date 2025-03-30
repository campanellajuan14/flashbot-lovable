
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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
    if (messages.length === 0 && chatbot) {
      const initialGreeting = chatbot.behavior?.greeting || 
        (chatbot.behavior?.language === 'en' 
          ? `Hello! I'm a virtual assistant. How can I help you today?`
          : `¡Hola! Soy un asistente virtual. ¿En qué puedo ayudarte hoy?`);
      handleBotResponse(initialGreeting);
    }
  }, [messages, chatbot]);

  const callClaudeAPI = async (messageHistory: ChatMessage[]) => {
    if (!chatbot) return null;
    
    try {
      const formattedMessages = messageHistory.map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      }));
      
      console.log("Calling Claude API with chatbot:", chatbot.id, "and messages:", formattedMessages);
      
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
        console.error("Error calling Claude API:", response.error);
        toast({
          title: "Error",
          description: response.error.message || "No se pudo conectar con el asistente IA",
          variant: "destructive"
        });
        return null;
      }
      
      return response.data;
    } catch (error: any) {
      console.error("Error calling Claude API:", error);
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al procesar tu mensaje",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messages || !chatbot) return;
    
    const message = inputRef.current?.value || "";
    if (!message.trim() || isTyping) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    // Clear the input field
    if (inputRef.current) inputRef.current.value = "";
    
    setIsTyping(true);
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    try {
      const updatedMessages = [...messages, userMessage];
      
      console.log("Sending message to chatbot:", chatbot.id);
      const apiResponse = await callClaudeAPI(updatedMessages);
      
      if (apiResponse) {
        const { message: responseText, references } = apiResponse;
        handleBotResponse(responseText, references);
      } else {
        const errorMessage = chatbot.behavior?.language === 'en'
          ? "I'm sorry, I'm having trouble responding. Please try again later."
          : "Lo siento, estoy teniendo problemas para responder. Por favor, inténtalo de nuevo más tarde.";
        handleBotResponse(errorMessage);
      }
    } catch (error: any) {
      console.error("Error processing message:", error);
      const errorMessage = chatbot.behavior?.language === 'en'
        ? "An error occurred while processing your message. Please try again."
        : "Ha ocurrido un error al procesar tu mensaje. Por favor, inténtalo de nuevo.";
      handleBotResponse(errorMessage);
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
    scrollToBottom();
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
