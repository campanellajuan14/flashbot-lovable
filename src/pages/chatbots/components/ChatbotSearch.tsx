
import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ChatbotSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const ChatbotSearch: React.FC<ChatbotSearchProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <div className="w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search chatbots..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default ChatbotSearch;
