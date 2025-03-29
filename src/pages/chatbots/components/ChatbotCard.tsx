
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bot, Copy, Edit, ExternalLink, FileText, MessageSquare, MoreHorizontal, Trash, Cpu } from "lucide-react";
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
    if (modelName.includes('Claude 3 Haiku')) return 'bg-violet-100 text-violet-800 hover:bg-violet-100';
    if (modelName.includes('Claude 3 Sonnet')) return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
    if (modelName.includes('Claude 3 Opus')) return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100';
    if (modelName.includes('GPT-4')) return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100';
    if (modelName.includes('GPT-3.5')) return 'bg-green-100 text-green-800 hover:bg-green-100';
    return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  };

  return (
    <Card className="dashboard-card overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-2 relative">
        <div className="flex items-center justify-between">
          <Badge variant={chatbot.is_active ? "default" : "secondary"} className="mb-2">
            {chatbot.is_active ? "Active" : "Inactive"}
          </Badge>
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
              <DropdownMenuItem asChild>
                <Link to={`/chatbots/${chatbot.id}/preview`} className="flex w-full cursor-pointer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Preview
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
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">{chatbot.name}</CardTitle>
        </div>
        <CardDescription className="line-clamp-2 mt-1">
          {chatbot.description || "No description"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-wrap gap-2 mb-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className={getModelBadgeColor(getModelName(chatbot))}>
                  <Cpu className="mr-1 h-3 w-3" />
                  {getModelName(chatbot)}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>AI Model</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className={
                  chatbot.documentCount > 0 
                    ? "bg-blue-100 text-blue-800 hover:bg-blue-100" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                }>
                  <FileText className="mr-1 h-3 w-3" />
                  {chatbot.documentCount} document{chatbot.documentCount !== 1 ? 's' : ''}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{chatbot.documentCount > 0 ? "Connected documents" : "No documents"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Conversations</p>
            <p className="font-medium">{0}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Language</p>
            <p className="font-medium">
              {chatbot.behavior?.language === 'es' ? 'Spanish' : 
                chatbot.behavior?.language === 'en' ? 'English' : 
                chatbot.behavior?.language || 'Not defined'}
            </p>
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
        <Button size="sm" asChild>
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
