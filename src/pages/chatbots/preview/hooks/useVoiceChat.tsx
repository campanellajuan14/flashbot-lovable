
import { useState, useEffect } from "react";

export const useVoiceChat = () => {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [apiKey, setApiKey] = useState<string | undefined>();

  // Load API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("elevenlabs_api_key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const toggleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
  };

  return {
    isVoiceMode,
    toggleVoiceMode,
    apiKey,
    setApiKey
  };
};
