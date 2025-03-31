
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ChatHeader from "./preview/ChatHeader";
import ChatMessageItem from "./preview/ChatMessageItem";
import ChatInput from "./preview/ChatInput";
import { useChatbotData } from "./preview/useChatbotData";
import { useChatMessages } from "./preview/useChatMessages";
import { ChatbotPersonality } from "./types";

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

  // Get language from behavior safely
  const getChatbotLanguage = (): string => {
    if (!chatbot || !chatbot.behavior) return "es";
    
    // If behavior is a ChatbotPersonality object
    if (typeof chatbot.behavior === 'object' && 'language' in chatbot.behavior) {
      return chatbot.behavior.language;
    }
    
    // Default to spanish if we can't determine the language
    return "es";
  };

  // Clear input field after message is sent
  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isTyping) return;
    
    handleSendMessage(e);
    setMessage("");
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
        <div className="text-xl font-semibold">Chatbot not found</div>
        <Button onClick={() => navigate('/chatbots')}>
          Back to Chatbots
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
          language={getChatbotLanguage()}
        />
      </div>
    </div>
  );
};

export default ChatbotPreview;
