
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

  // Get model badge color based on model name
  const getModelBadgeColor = (modelName: string) => {
    if (modelName.includes('Claude 3 Haiku')) return 'bg-amber-100 text-amber-800 hover:bg-amber-100';
    if (modelName.includes('Claude 3 Sonnet')) return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
    if (modelName.includes('Claude 3 Opus')) return 'bg-amber-200 text-amber-900 hover:bg-amber-200';
    if (modelName.includes('GPT-4')) return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100';
    if (modelName.includes('GPT-3.5')) return 'bg-green-100 text-green-800 hover:bg-green-100';
    return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  };

  return (
    <Card className="dashboard-card overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-2 relative flex flex-row justify-between items-start">
        <div className="flex flex-col items-start">
          <Badge variant={chatbot.is_active ? "success" : "secondary"} className="mb-2">
            {chatbot.is_active ? "Active" : "Inactive"}
          </Badge>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">{chatbot.name}</CardTitle>
          </div>
          <CardDescription className="line-clamp-2 mt-1 text-left">
            {chatbot.description || "No description"}
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
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
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className={getModelBadgeColor(getModelName(chatbot))}>
            <Cpu className="mr-1 h-3 w-3" />
            {getModelName(chatbot)}
          </Badge>
          
          <Badge variant="outline" className={
            chatbot.documentCount > 0 
              ? "bg-blue-100 text-blue-800 hover:bg-blue-100" 
              : "bg-gray-100 text-gray-600 hover:bg-gray-100"
          }>
            <FileText className="mr-1 h-3 w-3" />
            {chatbot.documentCount} {chatbot.documentCount === 1 ? 'document' : 'documents'}
          </Badge>
        </div>
        
        <div className="text-left text-sm">
          <div>
            <span className="text-muted-foreground">Conversations: </span>
            <span className="font-medium">0</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
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
