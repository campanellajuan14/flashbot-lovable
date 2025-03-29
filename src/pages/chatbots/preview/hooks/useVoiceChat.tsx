
import { useState, useEffect } from "react";

export const useVoiceChat = () => {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [apiKey, setApiKey] = useState<string | undefined>();

  // Load API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("elevenlabs_api_key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
    } else {
      // Use the provided API key if no key is stored
      const defaultKey = "sk_bdffed69862cce3ffd9d449f0b8c8238c999db387e4aef1f";
      localStorage.setItem("elevenlabs_api_key", defaultKey);
      setApiKey(defaultKey);
    }
  }, []);

  const toggleVoiceMode = () => {
    setIsVoiceMode((prev) => !prev);
  };

  return {
    isVoiceMode,
    toggleVoiceMode,
    apiKey,
    setApiKey
  };
};
