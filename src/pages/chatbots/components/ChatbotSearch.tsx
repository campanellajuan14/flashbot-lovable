
import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ChatbotSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const ChatbotSearch: React.FC<ChatbotSearchProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search chatbots..."
        className="pl-9 bg-background border-primary/20 rounded-full"
      />
    </div>
  );
};

export default ChatbotSearch;
