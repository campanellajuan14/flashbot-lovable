
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "./types";

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
        "flex w-full max-w-[90%]",
        message.role === "user" ? "ml-auto" : "mr-auto"
      )}
    >
      <div
        className={cn(
          "flex items-start gap-3",
          message.role === "user" ? "flex-row-reverse" : "flex-row"
        )}
      >
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
              "rounded-lg px-4 py-3",
              message.role === "user"
                ? "bg-primary text-primary-foreground chat-bubble-user"
                : "bg-accent text-accent-foreground chat-bubble-bot"
            )}
          >
            {message.content}
          </div>
          {message.references && message.references.length > 0 && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-2 mb-1">
                <button
                  onClick={() => toggleSourceDetails(message.id)}
                  className="inline-flex items-center text-xs text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-2 py-1 transition-colors"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  {showSourceDetails[message.id] ? "Hide sources" : `${message.references.length} sources`}
                </button>
              </div>

              {showSourceDetails[message.id] && (
                <div className="space-y-1 border rounded-md p-2 bg-background mt-1 text-xs">
                  <div className="font-medium text-muted-foreground mb-1">Reference documents:</div>
                  {message.references.map((ref, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-1 py-1 border-t border-dashed first:border-0"
                    >
                      <div className="flex-shrink-0 rounded-full bg-primary/10 w-4 h-4 flex items-center justify-center mt-0.5">
                        <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{ref.name}</div>
                        <div className="text-muted-foreground">
                          Relevance: {Math.round(ref.similarity * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
