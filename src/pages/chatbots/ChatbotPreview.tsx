
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
import { useVoiceChat } from "./preview/hooks/useVoiceChat";
import VoiceChat from "./preview/components/VoiceChat";
import { ChatMessage } from "./preview/types";
import { toast } from "sonner";

const ChatbotPreview = () => {
  const navigate = useNavigate();
  const { chatbot, isLoading, isError, id } = useChatbotData();
  const [message, setMessage] = useState("");
  const { isVoiceMode, toggleVoiceMode, apiKey, setApiKey } = useVoiceChat();
  
  const {
    messages,
    isTyping,
    messagesEndRef,
    inputRef,
    showSourceDetails,
    handleSendMessage,
    toggleSourceDetails
  } = useChatMessages(chatbot);

  // Handle message from voice chat
  const handleVoiceChatMessage = (text: string) => {
    const botMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "bot",
      content: text,
      timestamp: new Date(),
    };
    
    // Add the bot message to the chat
    // We access the internal method directly to bypass the user message creation
    // This allows us to add only the bot response message
    if (handleSendMessage) {
      setMessage("");
      handleSendMessage(null, botMessage);
    }
  };

  // Clear input field after message is sent
  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isTyping) return;
    
    handleSendMessage(e);
    setMessage("");
  };

  useEffect(() => {
    // Display a toast message when the component mounts to indicate voice chat is available
    toast.info("Voice chat is available! Click on the microphone icon in the header to try it.");
  }, []);

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
      <ChatHeader 
        chatbotId={id || ""} 
        chatbotName={chatbot.name}
        isVoiceMode={isVoiceMode}
        toggleVoiceMode={toggleVoiceMode}
        voiceChatEnabled={true}
      />
      
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full bg-background rounded-lg shadow-sm my-4 overflow-hidden">
        {isVoiceMode ? (
          <div className="border-b">
            <VoiceChat 
              chatbot={chatbot} 
              apiKey={apiKey}
              setApiKey={setApiKey}
              onMessageReceived={handleVoiceChatMessage}
            />
          </div>
        ) : null}
        
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
          language={chatbot.behavior?.language}
        />
      </div>
    </div>
  );
};

export default ChatbotPreview;
