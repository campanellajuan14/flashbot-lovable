
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ChatbotFormHeaderProps {
  isEditing: boolean;
}

const ChatbotFormHeader = ({ isEditing }: ChatbotFormHeaderProps) => {
  const navigate = useNavigate();

  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default button behavior
    e.stopPropagation(); // Stop event propagation
    navigate(-1);
  };

  return (
    <div className="flex items-center">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleBackClick}
        className="mr-4"
        type="button"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      <div className="text-left">
        <h1 className="text-3xl font-bold tracking-tight">
          {isEditing ? "Edit Chatbot" : "Create New Chatbot"}
        </h1>
        <p className="text-muted-foreground">
          Configure your chatbot's personality and behavior
        </p>
      </div>
    </div>
  );
};

export default ChatbotFormHeader;
