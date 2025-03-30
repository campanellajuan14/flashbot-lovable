
import React from "react";
import { Chatbot } from "@/pages/chatbots/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ConversationsFiltersProps {
  chatbots: Chatbot[];
  selectedChatbotId: string | undefined;
  onChatbotChange: (chatbotId: string | undefined) => void;
  dateRange: { from: Date | undefined; to: Date | undefined };
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
}

const ConversationsFilters: React.FC<ConversationsFiltersProps> = ({
  chatbots,
  selectedChatbotId,
  onChatbotChange,
  dateRange,
  onDateRangeChange,
}) => {
  // Handle chatbot selection change
  const handleChatbotChange = (value: string) => {
    onChatbotChange(value === "all" ? undefined : value);
  };

  // Format date range for display
  const formatDateRange = () => {
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, "PP", { locale: es })} - ${format(dateRange.to, "PP", { locale: es })}`;
    }
    if (dateRange.from) {
      return `Desde ${format(dateRange.from, "PP", { locale: es })}`;
    }
    return "Seleccionar fechas";
  };

  // Clear date range
  const handleClearDateRange = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateRangeChange({ from: undefined, to: undefined });
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
      
      <div className="w-full sm:w-64">
        <label className="text-sm font-medium mb-1 block">
          Filtrar por fecha
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateRange.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDateRange()}
              {(dateRange.from || dateRange.to) && (
                <span
                  onClick={handleClearDateRange}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                >
                  ×
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{
                from: dateRange.from || undefined,
                to: dateRange.to || undefined,
              }}
              onSelect={(range) => onDateRangeChange({
                from: range?.from,
                to: range?.to
              })}
              locale={es}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default ConversationsFilters;
