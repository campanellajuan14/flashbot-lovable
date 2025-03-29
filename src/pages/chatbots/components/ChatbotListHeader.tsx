
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const ChatbotListHeader: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Chatbots</h1>
        <p className="text-muted-foreground">
          Manage and monitor all your chatbots in one place
        </p>
      </div>
      <Button asChild>
        <Link to="/chatbots/new">
          <Plus className="mr-2 h-4 w-4" />
          Create Chatbot
        </Link>
      </Button>
    </div>
  );
};

export default ChatbotListHeader;
