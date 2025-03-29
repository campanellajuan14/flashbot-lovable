
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "./types";
import { formatMessageText } from "./utils/formatText";
import MessageSourceReferences from "./components/MessageSourceReferences";

interface ChatMessageItemProps {
  message: ChatMessage;
  showSourceDetails: Record<string, boolean>;
  toggleSourceDetails: (messageId: string) => void;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  showSourceDetails,
  toggleSourceDetails,
}) => {
  return (
    <div
      className={cn(
        "flex w-full",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "flex items-start gap-3 max-w-[80%]",
        message.role === "user" ? "flex-row-reverse" : "flex-row"
      )}>
        <Avatar className={message.role === "user" ? "bg-primary" : "bg-accent border"}>
          {message.role === "user" ? (
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
        <div className="max-w-full">
          <div
            className={cn(
              "rounded-lg px-4 py-3 text-left",
              message.role === "user"
                ? "bg-primary text-primary-foreground chat-bubble-user"
                : "bg-accent text-accent-foreground chat-bubble-bot"
            )}
          >
            {message.role === "user" 
              ? message.content 
              : formatMessageText(message.content)}
          </div>
          
          {message.references && message.references.length > 0 && (
            <MessageSourceReferences
              messageId={message.id}
              references={message.references}
              showSourceDetails={showSourceDetails}
              toggleSourceDetails={toggleSourceDetails}
            />
          )}
          
          <div className="mt-1 text-xs text-muted-foreground pl-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessageItem;
