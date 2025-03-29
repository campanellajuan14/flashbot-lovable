
import React, { useState, useRef, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Bot, Copy, User, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
  references?: string[];
}

interface Chatbot {
  id: string;
  name: string;
  description: string;
  user_id: string;
  is_active: boolean;
  behavior: {
    tone?: string;
    style?: string;
    language?: string;
    useEmojis?: boolean;
    askQuestions?: boolean;
    suggestSolutions?: boolean;
    instructions?: string;
  };
  settings?: Record<string, any>;
}

const ChatbotPreview = () => {
  const { id } = useParams<{ id: string }>();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Fetch chatbot data from Supabase
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
      return data as Chatbot;
    },
    retry: 1,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    if (messages.length === 0 && chatbot) {
      // Add initial bot message
      handleBotResponse(`¡Hola! Soy ${chatbot.name}. ${chatbot.description ? chatbot.description : "¿En qué puedo ayudarte hoy?"}`);
    }
  }, [messages, chatbot]);

  // For debugging
  useEffect(() => {
    console.log("Chatbot data:", chatbot);
  }, [chatbot]);

  const callClaudeAPI = async (messageHistory: ChatMessage[]) => {
    if (!chatbot) return null;
    
    try {
      // Format messages for Claude API
      const formattedMessages = messageHistory.map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      }));
      
      const response = await supabase.functions.invoke('claude-chat', {
        body: {
          messages: formattedMessages,
          behavior: chatbot.behavior,
          chatbotName: chatbot.name
        }
      });
      
      if (response.error) {
        console.error("Error calling Claude API:", response.error);
        toast({
          title: "Error",
          description: "No se pudo conectar con el asistente IA",
          variant: "destructive"
        });
        return null;
      }
      
      return response.data.message;
    } catch (error) {
      console.error("Error calling Claude API:", error);
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
    if (!message.trim() || !chatbot || isTyping) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    
    // Update messages state with the new user message
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setMessage("");
    setIsTyping(true);
    
    // Focus back on input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    try {
      // Get all messages including the new one for context
      const updatedMessages = [...messages, userMessage];
      
      // Call Claude API
      const aiResponse = await callClaudeAPI(updatedMessages);
      
      if (aiResponse) {
        handleBotResponse(aiResponse);
      } else {
        // Fallback response if API fails
        handleBotResponse("Lo siento, estoy teniendo problemas para responder. Por favor, inténtalo de nuevo más tarde.");
      }
    } catch (error) {
      console.error("Error processing message:", error);
      handleBotResponse("Ha ocurrido un error al procesar tu mensaje. Por favor, inténtalo de nuevo.");
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleBotResponse = (content: string, references?: string[]) => {
    const botMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "bot",
      content,
      timestamp: new Date(),
      references,
    };
    
    setMessages(prev => [...prev, botMessage]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !chatbot) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-xl font-semibold">Chatbot no encontrado</div>
        <Button onClick={() => navigate('/chatbots')}>
          Volver a Chatbots
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              asChild
            >
              <Link to={`/chatbots/${id}`}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{chatbot.name}</h1>
              <p className="text-sm text-muted-foreground">Modo Vista Previa</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/chatbots/${id}`}>
                Editar Chatbot
              </Link>
            </Button>
          </div>
        </div>
      </header>
      
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-6 py-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex w-max max-w-[90%]",
                  msg.role === "user" ? "ml-auto" : "mr-auto"
                )}
              >
                <div 
                  className={cn(
                    "flex items-start gap-3",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <Avatar className={msg.role === "user" ? "bg-primary" : "bg-accent border"}>
                    {msg.role === "user" ? (
                      <>
                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        <AvatarImage src="" />
                      </>
                    ) : (
                      <>
                        <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                        <AvatarImage src="" />
                      </>
                    )}
                  </Avatar>
                  <div>
                    <div
                      className={cn(
                        "rounded-lg px-4 py-3",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground chat-bubble-user"
                          : "bg-accent text-accent-foreground chat-bubble-bot"
                      )}
                    >
                      {msg.content}
                    </div>
                    {msg.references && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {msg.references.map((ref, i) => (
                          <div 
                            key={i}
                            className="inline-flex items-center text-xs text-muted-foreground bg-secondary rounded-full px-2 py-1"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            {ref}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-1 text-xs text-muted-foreground pl-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex w-max max-w-[90%] mr-auto">
                <div className="flex items-start gap-3">
                  <Avatar className="bg-accent border">
                    <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                    <AvatarImage src="" />
                  </Avatar>
                  <div className="rounded-lg px-4 py-3 bg-accent text-accent-foreground">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        <Separator />
        
        <div className="p-4">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <Input
              ref={inputRef}
              placeholder="Escribe tu mensaje..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1"
              autoFocus
            />
            <Button type="submit" size="icon" disabled={!message.trim() || isTyping}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Esta es una vista previa de cómo aparecerá tu chatbot para los usuarios.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPreview;
