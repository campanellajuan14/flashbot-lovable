
import React, { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Bot, Copy, User, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
  references?: string[];
}

const ChatbotPreview = () => {
  const { id } = useParams<{ id: string }>();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Mock chatbot data (in a real app, this would be fetched from your API)
  const chatbot = {
    id: id || "unknown",
    name: "Customer Support Bot",
    description: "Helps customers with common questions and issues",
    avatarUrl: "",
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    if (messages.length === 0) {
      // Add initial bot message
      handleBotResponse("Hi there! I'm the Customer Support Assistant. How can I help you today?");
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsTyping(true);
    
    // Focus back on input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    // Simulate bot thinking and responding
    setTimeout(() => {
      let response = "";
      
      // Very simple response logic for demo
      const lowercaseMessage = message.toLowerCase();
      if (lowercaseMessage.includes("hello") || lowercaseMessage.includes("hi")) {
        response = "Hello! How can I assist you today?";
      } else if (lowercaseMessage.includes("return")) {
        response = "Our return policy allows returns within 30 days of purchase. You can initiate a return from your order history page or contact our support team.";
      } else if (lowercaseMessage.includes("shipping") || lowercaseMessage.includes("delivery")) {
        response = "We offer standard shipping (3-5 business days) and express shipping (1-2 business days). Shipping is free for orders over $50.";
      } else if (lowercaseMessage.includes("payment") || lowercaseMessage.includes("pay")) {
        response = "We accept all major credit cards, PayPal, and Apple Pay as payment methods.";
      } else if (lowercaseMessage.includes("hours") || lowercaseMessage.includes("open")) {
        response = "Our customer service team is available Monday to Friday, 9am to 6pm EST.";
      } else {
        response = "I understand you're asking about " + message.split(" ").slice(0, 3).join(" ") + "... To best assist you, could you provide more details about your question?";
      }
      
      handleBotResponse(response, lowercaseMessage.includes("shipping") ? ["Shipping Policy", "FAQ"] : undefined);
      setIsTyping(false);
    }, 1500);
  };
  
  const handleBotResponse = (content: string, references?: string[]) => {
    const botMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "bot",
      content,
      timestamp: new Date(),
      references,
    };
    
    setMessages((prev) => [...prev, botMessage]);
  };

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
              <p className="text-sm text-muted-foreground">Preview Mode</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/chatbots/${id}`}>
                Edit Chatbot
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
                        <AvatarImage src={chatbot.avatarUrl} />
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
                    <AvatarImage src={chatbot.avatarUrl} />
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
              placeholder="Type your message..."
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
            This is a preview of how your chatbot will appear to users.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPreview;
