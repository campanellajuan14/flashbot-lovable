
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus } from "lucide-react";

interface EmptyChatbotStateProps {
  searchQuery: string;
}

const EmptyChatbotState: React.FC<EmptyChatbotStateProps> = ({ searchQuery }) => {
  return (
    <div className="text-center py-8">
      <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
      <h3 className="mt-4 text-lg font-semibold">No chatbots found</h3>
      <p className="mt-2 text-muted-foreground">
        {searchQuery ? "Try a different search term" : "Create your first chatbot to get started"}
      </p>
      <Button className="mt-4" asChild>
        <Link to="/chatbots/new">
          <Plus className="mr-2 h-4 w-4" />
          Create Chatbot
        </Link>
      </Button>
    </div>
  );
};

export default EmptyChatbotState;
