
import React from "react";
import { Message } from "@/hooks/useConversationDetails";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ConversationMessagesProps {
  messages: Message[];
}

const ConversationMessages: React.FC<ConversationMessagesProps> = ({ messages }) => {
  if (messages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay mensajes en esta conversación
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex items-start gap-3 rounded-lg p-4",
            message.role === "assistant"
              ? "bg-primary/10"
              : "bg-muted"
          )}
        >
          <Avatar className={cn(
            "h-8 w-8",
            message.role === "assistant" 
              ? "bg-primary/20" 
              : "bg-secondary/20"
          )}>
            <AvatarFallback>
              {message.role === "assistant" ? (
                <Bot className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="font-medium">
                {message.role === "assistant" ? "Chatbot" : "Usuario"}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(message.created_at), "dd MMM, HH:mm", { locale: es })}
              </div>
            </div>
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConversationMessages;
