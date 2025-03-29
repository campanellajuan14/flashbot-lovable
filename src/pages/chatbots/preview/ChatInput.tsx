
import React, { FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ChatInputProps {
  message: string;
  setMessage: (message: string) => void;
  handleSendMessage: (e: FormEvent) => void;
  isTyping: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  language?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  message,
  setMessage,
  handleSendMessage,
  isTyping,
  inputRef,
  language,
}) => {
  return (
    <div className="p-4">
      <form onSubmit={handleSendMessage} className="flex items-end gap-2">
        <Input
          ref={inputRef}
          placeholder="Escribe tu mensaje..."
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
        Esta es una vista previa de cómo aparecerá tu chatbot para los usuarios.
        {language === 'english' && " Recuerda que este chatbot está configurado para responder en inglés."}
      </p>
    </div>
  );
};

export default ChatInput;
