
import React from "react";
import { ChatbotWithDocuments } from "../types";
import ChatbotCard from "./ChatbotCard";

interface ChatbotGridViewProps {
  chatbots: ChatbotWithDocuments[];
  onCopyId: (id: string) => void;
  onDelete: (id: string) => void;
}

const ChatbotGridView: React.FC<ChatbotGridViewProps> = ({ chatbots, onCopyId, onDelete }) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {chatbots.map((chatbot) => (
        <ChatbotCard 
          key={chatbot.id} 
          chatbot={chatbot} 
          onCopyId={onCopyId} 
          onDelete={onDelete} 
        />
      ))}
    </div>
  );
};

export default ChatbotGridView;
