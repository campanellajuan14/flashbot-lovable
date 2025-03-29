
import React from "react";
import { ArrowLeft, Info, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import VoiceChatButton from "./components/VoiceChatButton";

interface ChatHeaderProps {
  chatbotId: string;
  chatbotName: string;
  isVoiceMode?: boolean;
  toggleVoiceMode?: () => void;
  voiceChatEnabled?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  chatbotId,
  chatbotName,
  isVoiceMode = false,
  toggleVoiceMode,
  voiceChatEnabled = true
}) => {
  return (
    <header className="flex items-center justify-between p-3 border-b bg-white">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/chatbots/${chatbotId}`}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        
        <div className="font-semibold">{chatbotName}</div>
      </div>
      
      <div className="flex items-center gap-3">
        {toggleVoiceMode && (
          <VoiceChatButton 
            isVoiceMode={isVoiceMode || false} 
            toggleVoiceMode={toggleVoiceMode} 
            isEnabled={voiceChatEnabled || false} 
          />
        )}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Info className="h-5 w-5" />
                <span className="sr-only">Chatbot Info</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View chatbot information</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={`/chatbots/${chatbotId}`}>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Chatbot Settings</span>
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
};

export default ChatHeader;
