
import React, { useEffect, useState } from "react";
import { useConversation } from "@11labs/react";
import { Chatbot } from "../types";
import { Button } from "@/components/ui/button";
import { AlertCircle, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface VoiceChatProps {
  chatbot: Chatbot;
  apiKey?: string;
  setApiKey: (key: string) => void;
  onMessageReceived: (message: string) => void;
}

const VoiceChat: React.FC<VoiceChatProps> = ({ 
  chatbot, 
  apiKey, 
  setApiKey,
  onMessageReceived 
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(apiKey || "");
  
  // Set up conversation with ElevenLabs
  const conversation = useConversation({
    onConnect: () => {
      toast.success("Voice chat connected");
      setIsListening(true);
    },
    onDisconnect: () => {
      setIsListening(false);
    },
    onMessage: (message) => {
      if (message.type === 'agent_response' && message.content) {
        // Pass the message back to the parent component
        onMessageReceived(message.content);
      }
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      setIsListening(false);
    }
  });

  // Handle volume toggle
  const toggleMute = async () => {
    if (conversation) {
      try {
        await conversation.setVolume({ volume: isMuted ? 1.0 : 0.0 });
        setIsMuted(!isMuted);
      } catch (error) {
        console.error("Failed to toggle volume:", error);
      }
    }
  };

  // Handle listening toggle
  const toggleListening = async () => {
    if (!apiKey) {
      toast.error("Please enter your ElevenLabs API key first");
      return;
    }

    try {
      if (isListening) {
        await conversation.endSession();
      } else {
        // Request microphone permission
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
          toast.error("Microphone access is required for voice chat");
          return;
        }

        // Build system prompt based on chatbot configuration
        let systemPrompt = `You are a chatbot named ${chatbot.name}. `;

        if (chatbot.behavior) {
          if (chatbot.behavior.tone) {
            systemPrompt += `\nYou should respond in a ${chatbot.behavior.tone} tone. `;
          }
          
          if (chatbot.behavior.style) {
            systemPrompt += `\nYour response style should be ${chatbot.behavior.style}. `;
          }
          
          if (chatbot.behavior.language) {
            systemPrompt += `\nYou must communicate in ${chatbot.behavior.language}. `;
          }
          
          if (chatbot.behavior.instructions) {
            systemPrompt += `\nAdditional instructions: ${chatbot.behavior.instructions}`;
          }
        }

        await conversation.startSession({
          // Get url from ElevenLabs
          agentId: 'conversational-ai-agent',
          // Override with our custom settings
          overrides: {
            agent: {
              prompt: {
                prompt: systemPrompt,
              },
              firstMessage: chatbot.behavior?.greeting || "Hello, how can I help you today?",
              language: chatbot.behavior?.language || "en",
            },
            tts: {
              voiceId: "EXAVITQu4vr4xnSDxMaL" // Sarah voice
            },
          },
        });
      }
    } catch (error) {
      console.error("Error toggling conversation:", error);
      toast.error("Failed to toggle voice chat");
    }
  };

  // Save API key
  const handleSaveApiKey = () => {
    setApiKey(apiKeyInput);
    localStorage.setItem("elevenlabs_api_key", apiKeyInput);
    toast.success("API key saved");
    
    // Auto-start conversation
    if (!isListening) {
      toggleListening();
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        conversation.endSession().catch(console.error);
      }
    };
  }, [isListening]);

  if (!apiKey) {
    return (
      <div className="p-4 space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>ElevenLabs API Key Required</AlertTitle>
          <AlertDescription>
            To use voice chat, please enter your ElevenLabs API key.
          </AlertDescription>
        </Alert>
        
        <div className="flex space-x-2">
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="Enter your ElevenLabs API key"
            className="flex-1 px-3 py-2 border rounded"
          />
          <Button onClick={handleSaveApiKey} disabled={!apiKeyInput}>
            Save & Start
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isListening ? "destructive" : "default"}
                  size="sm"
                  onClick={toggleListening}
                >
                  {isListening ? (
                    <>
                      <MicOff className="mr-2 h-4 w-4" />
                      Stop Listening
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-4 w-4" />
                      Start Listening
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isListening ? "Stop voice conversation" : "Start voice conversation"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {isListening && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={toggleMute}>
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isMuted ? "Unmute" : "Mute"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        {isListening && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">
              {isListening ? "Listening..." : "Voice chat inactive"}
            </span>
            <div className={`w-2 h-2 rounded-full ${isListening ? "bg-green-500 animate-pulse" : "bg-gray-300"}`}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceChat;
