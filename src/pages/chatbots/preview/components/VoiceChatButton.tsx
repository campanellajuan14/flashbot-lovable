
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
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={toggleVoiceMode}
            disabled={!isEnabled}
          >
            {isVoiceMode ? (
              <MicOff className="h-5 w-5 text-red-500" />
            ) : (
              <Mic className="h-5 w-5" />
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
