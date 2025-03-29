
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
            variant={isVoiceMode ? "outline" : "ghost"}
            size="icon"
            className="rounded-full relative"
            onClick={toggleVoiceMode}
            disabled={!isEnabled}
          >
            {isVoiceMode ? (
              <MicOff className="h-5 w-5 text-red-500" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
            {isVoiceMode && (
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
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
