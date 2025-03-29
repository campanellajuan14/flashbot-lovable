
import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VoiceChatButtonProps {
  isVoiceMode: boolean;
  toggleVoiceMode: () => void;
  isEnabled: boolean;
}

const VoiceChatButton: React.FC<VoiceChatButtonProps> = ({
  isVoiceMode,
  toggleVoiceMode,
  isEnabled = true
}) => {
  if (!isEnabled) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isVoiceMode ? "default" : "outline"}
            size="sm"
            className={`relative ${isVoiceMode ? 'bg-red-500 hover:bg-red-600' : ''}`}
            onClick={toggleVoiceMode}
            disabled={!isEnabled}
          >
            {isVoiceMode ? (
              <>
                <MicOff className="h-4 w-4 mr-1 text-white" />
                <span>Voice Active</span>
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-1" />
                <span>Voice Chat</span>
              </>
            )}
            <span className="sr-only">{isVoiceMode ? "Disable Voice Chat" : "Enable Voice Chat"}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isVoiceMode ? "Disable Voice Chat" : "Enable Voice Chat"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VoiceChatButton;
