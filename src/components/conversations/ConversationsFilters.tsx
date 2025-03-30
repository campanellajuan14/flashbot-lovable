
import React from "react";
import { Chatbot } from "@/pages/chatbots/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ConversationsFiltersProps {
  chatbots: Chatbot[];
  selectedChatbotId: string | undefined;
  onChatbotChange: (chatbotId: string | undefined) => void;
}

const ConversationsFilters: React.FC<ConversationsFiltersProps> = ({
  chatbots,
  selectedChatbotId,
  onChatbotChange,
}) => {
  // Handle chatbot selection change
  const handleChatbotChange = (value: string) => {
    onChatbotChange(value === "all" ? undefined : value);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row items-start">
      <div className="w-full sm:w-64">
        <label className="text-sm font-medium mb-1 block">
          Filtrar por Chatbot
        </label>
        <Select
          value={selectedChatbotId || "all"}
          onValueChange={handleChatbotChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos los chatbots" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los chatbots</SelectItem>
            {chatbots.map((chatbot) => (
              <SelectItem key={chatbot.id} value={chatbot.id}>
                {chatbot.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Aquí puedes añadir más filtros en el futuro, como fecha o búsqueda de texto */}
    </div>
  );
};

export default ConversationsFilters;
