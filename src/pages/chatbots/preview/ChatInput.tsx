
import React, { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ChatInputProps {
  message: string;
  setMessage: (message: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  isTyping: boolean;
  inputRef: RefObject<HTMLInputElement>;
  language?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  message,
  setMessage,
  handleSendMessage,
  isTyping,
  inputRef,
  language = "spanish"
}) => {
  const placeholderText = language?.toLowerCase() === "english" 
    ? "Type your message..." 
    : "Escribe tu mensaje...";

  // Also handle key press for Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="p-4 border-t">
      <form onSubmit={handleSendMessage} className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholderText}
            disabled={isTyping}
            className="w-full p-3 bg-background border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <Button 
          type="submit" 
          disabled={!message.trim() || isTyping}
          variant="default"
        >
          {isTyping ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            language?.toLowerCase() === "english" ? "Send" : "Enviar"
          )}
        </Button>
      </form>
    </div>
  );
};

export default ChatInput;
