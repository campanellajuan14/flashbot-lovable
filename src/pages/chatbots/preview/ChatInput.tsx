
import React, { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

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
  language = "es",
}) => {
  const placeholderText = language === "en" ? "Type a message..." : "Escribe un mensaje...";
  const sendText = language === "en" ? "Send" : "Enviar";

  const handleSubmit = (e: React.FormEvent) => {
    handleSendMessage(e);
    setMessage(""); // Clear the input after sending
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t p-4"
    >
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholderText}
            className="w-full px-4 py-2.5 rounded-full border bg-background focus-visible:ring-1 focus-visible:ring-offset-0"
            disabled={isTyping}
          />
        </div>
        <Button
          type="submit"
          size="icon"
          className="rounded-full h-10 w-10 flex-shrink-0"
          disabled={isTyping || !message.trim()}
        >
          <Send className="h-5 w-5" />
          <span className="sr-only">{sendText}</span>
        </Button>
      </div>
    </form>
  );
};

export default ChatInput;
