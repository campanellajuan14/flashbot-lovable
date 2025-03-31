
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShareSettings } from "../types";
import { createDefaultWidgetConfig } from "../utils";
import { toast } from "sonner";

export const useWidgetSettings = (chatbotId: string | undefined) => {
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const [widgetConfig, setWidgetConfig] = useState<ShareSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!chatbotId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch the chatbot settings
        const { data: chatbot, error: chatbotError } = await supabase
          .from("chatbots")
          .select("share_settings")
          .eq("id", chatbotId)
          .single();
        
        if (chatbotError) {
          console.error('Error fetching chatbot:', chatbotError);
          setError(chatbotError.message);
          throw chatbotError;
        }
        
        console.log("Retrieved chatbot data:", chatbot);
        
        const shareSettings = chatbot?.share_settings as ShareSettings | null;
        
        // If widget_id exists in share_settings, use it
        if (shareSettings?.widget_id) {
          console.log("Using existing widget ID:", shareSettings.widget_id);
          setWidgetId(shareSettings.widget_id);
          setWidgetConfig(shareSettings);
        } else {
          // Generate a new widget ID
          const newWidgetId = crypto.randomUUID();
          console.log("Generated new widget ID:", newWidgetId);
          setWidgetId(newWidgetId);
          
          // Create default settings with the new widget ID
          const defaultConfig = createDefaultWidgetConfig(newWidgetId);
          setWidgetConfig(defaultConfig);
          
          console.log("Updating chatbot with new widget ID");
          
          // Update chatbot with new widget_id and default settings
          const { error: updateError } = await supabase
            .from("chatbots")
            .update({ 
              share_settings: defaultConfig as any
            })
            .eq("id", chatbotId);
            
          if (updateError) {
            console.error('Error updating chatbot with new widget ID:', updateError);
            setError(updateError.message);
            throw updateError;
          }
            
          console.log("Chatbot updated with new widget ID");
        }
      } catch (error: any) {
        console.error('Error fetching widget settings:', error);
        setError(error?.message || "Could not load widget settings");
        toast.error("Could not load widget settings");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [chatbotId]);
  
  const saveWidgetConfig = async (newConfig: ShareSettings) => {
    if (!newConfig || !chatbotId) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      console.log("Saving widget settings with ID:", newConfig.widget_id);
      
      // Update existing settings in the share_settings field
      const { error: updateError } = await supabase
        .from("chatbots")
        .update({ 
          share_settings: newConfig as any
        })
        .eq("id", chatbotId);
      
      if (updateError) {
        setError(updateError.message);
        throw updateError;
      }
      
      // Update local widget config state
      setWidgetConfig(newConfig);
      
      toast.success("Widget settings saved successfully");
      console.log("Widget settings saved successfully");
    } catch (error: any) {
      console.error('Error saving widget settings:', error);
      setError(error?.message || "Could not save widget settings");
      toast.error("Could not save widget settings");
    } finally {
      setIsSaving(false);
    }
  };
  
  return {
    widgetId,
    widgetConfig,
    setWidgetConfig,
    isLoading,
    isSaving,
    error,
    saveWidgetConfig,
    updateSettings: saveWidgetConfig // Maintain for compatibility
  };
};
