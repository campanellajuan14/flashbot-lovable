
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bot, Copy, Edit, MessageSquare, MoreHorizontal, Trash, Cpu, FileText } from "lucide-react";
import { ChatbotWithDocuments } from "../types";

interface ChatbotCardProps {
  chatbot: ChatbotWithDocuments;
  onCopyId: (id: string) => void;
  onDelete: (id: string) => void;
}

const ChatbotCard: React.FC<ChatbotCardProps> = ({ chatbot, onCopyId, onDelete }) => {
  // Helper function to get AI model name in a user-friendly format
  const getModelName = (chatbot: ChatbotWithDocuments) => {
    const model = chatbot.settings?.model || 'claude-3-haiku-20240307';
    
    if (model.includes('claude-3-haiku')) return 'Claude 3 Haiku';
    if (model.includes('claude-3-sonnet')) return 'Claude 3 Sonnet';
    if (model.includes('claude-3-opus')) return 'Claude 3 Opus';
    if (model.includes('gpt-4')) return 'GPT-4';
    if (model.includes('gpt-3.5')) return 'GPT-3.5';
    
    return model.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Get model badge color based on model name - simplified color palette
  const getModelBadgeColor = (modelName: string) => {
    if (modelName.includes('Claude')) return 'bg-amber-50 text-amber-800 hover:bg-amber-50';
    if (modelName.includes('GPT')) return 'bg-emerald-50 text-emerald-800 hover:bg-emerald-50';
    return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  };

  return (
    <Card className="dashboard-card overflow-hidden transition-all duration-200 hover:shadow-md flex flex-col h-full">
      <CardHeader className="pb-2 relative flex flex-row justify-between items-start">
        <div className="flex flex-col items-start w-full">
          <Badge variant="secondary" className={chatbot.is_active ? "bg-green-50 text-green-700 hover:bg-green-50" : ""}>
            {chatbot.is_active ? "Active" : "Inactive"}
          </Badge>
          <div className="flex items-center gap-2 w-full justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary flex-shrink-0" />
              <CardTitle className="text-xl text-left">{chatbot.name}</CardTitle>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/chatbots/${chatbot.id}`} className="flex w-full cursor-pointer">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex cursor-pointer"
                  onClick={() => onCopyId(chatbot.id)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy ID
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => onDelete(chatbot.id)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardDescription className="line-clamp-2 mt-1 text-left w-full">
            {chatbot.description || "No description"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className={getModelBadgeColor(getModelName(chatbot))}>
            <Cpu className="mr-1 h-3 w-3" />
            {getModelName(chatbot)}
          </Badge>
          
          <Badge variant="outline" className="bg-blue-50 text-blue-800 hover:bg-blue-50">
            <FileText className="mr-1 h-3 w-3" />
            {chatbot.documentCount} {chatbot.documentCount === 1 ? 'document' : 'documents'}
          </Badge>
        </div>
        
        <div className="text-left text-sm">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Conversations:</span>
            <span className="font-medium">0</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="mt-auto flex justify-between pt-2 border-t">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/chatbots/${chatbot.id}`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
        <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
          <Link to={`/chatbots/${chatbot.id}/preview`}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Test
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ChatbotCard;
