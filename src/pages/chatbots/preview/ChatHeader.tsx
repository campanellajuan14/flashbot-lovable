
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Mic } from "lucide-react";

interface ChatHeaderProps {
  chatbotId: string;
  chatbotName: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ chatbotId, chatbotName }) => {
  return (
    <header className="border-b px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/chatbots/${chatbotId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{chatbotName}</h1>
            <p className="text-sm text-muted-foreground">Preview Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/chatbots/${chatbotId}/documents`}>
              <BookOpen className="h-4 w-4 mr-2" />
              Documents
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/chatbots/${chatbotId}`}>
              Edit Chatbot
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
