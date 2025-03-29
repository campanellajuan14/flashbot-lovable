
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <ChatHeader chatbotId={id || ""} chatbotName={chatbot.name} />
      
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-6 py-4">
            {messages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                showSourceDetails={showSourceDetails}
                toggleSourceDetails={toggleSourceDetails}
              />
            ))}
            
            {isTyping && (
              <div className="flex w-max max-w-[90%] mr-auto">
                <div className="flex items-start gap-3">
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
          handleSendMessage={handleSendMessage}
          isTyping={isTyping}
          inputRef={inputRef}
          language={chatbot.behavior?.language}
        />
      </div>
    </div>
  );
};

export default ChatbotPreview;
