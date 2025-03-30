
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Bot, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ChatHeader from "./preview/ChatHeader";
import ChatMessageItem from "./preview/ChatMessageItem";
import ChatInput from "./preview/ChatInput";
import { useChatbotData } from "./preview/useChatbotData";
import { useChatMessages } from "./preview/useChatMessages";

const ChatbotPreview = () => {
  const navigate = useNavigate();
  const { chatbot, isLoading, isError, id } = useChatbotData();
  const [message, setMessage] = useState("");
  
  const {
    messages,
    isTyping,
    messagesEndRef,
    inputRef,
    showSourceDetails,
    handleSendMessage,
    toggleSourceDetails
  } = useChatMessages(chatbot);

  // Forzar el scroll hacia abajo cuando llegan nuevos mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // Clear input field after message is sent
  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isTyping) return;
    
    handleSendMessage(e);
    setMessage("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <div className="text-muted-foreground">Cargando chatbot...</div>
      </div>
    );
  }

  if (isError || !chatbot) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Chatbot no encontrado</AlertTitle>
          <AlertDescription>
            No se ha podido encontrar el chatbot con ID: {id}. 
            Por favor, verifique que el ID sea correcto y que tenga permisos para acceder a este chatbot.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/chatbots')}>
          Volver a la lista de chatbots
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      <ChatHeader chatbotId={id || ""} chatbotName={chatbot.name} />
      
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full bg-background rounded-lg shadow-sm my-4 overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-8">
            {messages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                showSourceDetails={showSourceDetails}
                toggleSourceDetails={toggleSourceDetails}
              />
            ))}
            
            {isTyping && (
              <div className="flex w-max">
                <div className="flex items-start gap-3">
                  <Avatar className="bg-accent border">
                    <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
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
        
        <ChatInput
          message={message}
          setMessage={setMessage}
          handleSendMessage={handleMessageSubmit}
          isTyping={isTyping}
          inputRef={inputRef}
          language={chatbot.behavior?.language || "es"}
        />
      </div>
    </div>
  );
};

export default ChatbotPreview;
