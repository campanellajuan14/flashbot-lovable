
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { parsePersonalityData, parseSettingsData, determineAiProvider } from "./form-utils";
import { defaultPersonality, defaultSettings } from "../constants";

/**
 * Hook to load chatbot data for editing
 */
export const useChatbotData = (
  id: string | undefined, 
  userId: string | undefined,
  setForm: (form: any) => void,
  setAiProvider: (provider: "claude" | "openai") => void,
  handleNestedChange: (parent: string, field: string, value: any) => void
) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // Only fetch data if both ID and userId are available
    if (!id || !userId) {
      console.log("useChatbotData: Missing id or userId, skipping fetch", { id, userId });
      return;
    }
    
    // Prevent multiple fetches
    let isMounted = true;
    setIsLoading(true);
    
    console.log(`useChatbotData: Fetching chatbot data for id=${id}, userId=${userId}`);
    
    const fetchChatbot = async () => {
      try {
        const { data, error } = await supabase
          .from('chatbots')
          .select('*')
          .eq('id', id)
          .eq('user_id', userId)
          .single();
        
        if (error) {
          console.error("Error fetching chatbot data:", error);
          throw error;
        }
        
        // Only proceed if component is still mounted
        if (!isMounted) {
          console.log("useChatbotData: Component unmounted, stopping processing");
          return;
        }
        
        if (data) {
          console.log("useChatbotData: Received chatbot data:", data);
          
          // Parse personality data with defaults
          let personalityData = { ...defaultPersonality };
          if (data.behavior) {
            console.log("useChatbotData: Parsing behavior data:", data.behavior);
            try {
              if (typeof data.behavior === 'object' && !Array.isArray(data.behavior)) {
                personalityData = parsePersonalityData(data.behavior as Record<string, unknown>);
              } else {
                console.warn("useChatbotData: behavior is not an object:", data.behavior);
              }
            } catch (err) {
              console.error("useChatbotData: Error parsing behavior:", err);
              // Use defaults instead of failing
            }
          } else {
            console.log("useChatbotData: No behavior data, using defaults");
          }
          
          // Parse settings data with defaults
          let settingsData = { ...defaultSettings };
          if (data.settings) {
            console.log("useChatbotData: Parsing settings data:", data.settings);
            try {
              if (typeof data.settings === 'object' && !Array.isArray(data.settings)) {
                settingsData = parseSettingsData(data.settings as Record<string, unknown>);
                
                // Ensure maxTokens is a number
                if (settingsData.maxTokens !== undefined) {
                  if (typeof settingsData.maxTokens === 'string') {
                    settingsData.maxTokens = parseInt(settingsData.maxTokens, 10) || 500;
                  }
                } else {
                  settingsData.maxTokens = 500;
                }
                
                // Ensure temperature is a number
                if (settingsData.temperature !== undefined) {
                  if (typeof settingsData.temperature === 'string') {
                    settingsData.temperature = parseFloat(settingsData.temperature) || 0.7;
                  }
                } else {
                  settingsData.temperature = 0.7;
                }
              } else {
                console.warn("useChatbotData: settings is not an object:", data.settings);
              }
            } catch (err) {
              console.error("useChatbotData: Error parsing settings:", err);
              // Use defaults instead of failing
            }
          } else {
            console.log("useChatbotData: No settings data, using defaults");
          }
          
          const formData = {
            name: data.name || "",
            description: data.description || "",
            isActive: data.is_active ?? true,
            personality: personalityData,
            settings: settingsData
          };
          
          console.log("useChatbotData: Setting form data:", formData);
          
          // Update form state with parsed data
          setForm(formData);
          
          // Determine the provider based on the model
          if (settingsData.model) {
            const provider = settingsData.model.includes('claude') ? "claude" : "openai";
            console.log(`useChatbotData: Setting AI provider to ${provider} based on model ${settingsData.model}`);
            setAiProvider(provider);
          } else {
            // If no model defined, use Claude by default
            console.log("useChatbotData: No model defined, using Claude as default provider");
            setAiProvider("claude");
            // Set a default Claude model if there is none
            handleNestedChange("settings", "model", "claude-3-haiku-20240307");
          }
        } else {
          console.warn("useChatbotData: No data returned from query");
        }
      } catch (error) {
        console.error("Error fetching chatbot:", error);
        if (isMounted) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load chatbot data",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchChatbot();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      console.log("useChatbotData: Cleaning up effect");
      isMounted = false;
    };
  }, [id, userId, setForm, setAiProvider, handleNestedChange, toast]);
  
  return { isLoading };
};
