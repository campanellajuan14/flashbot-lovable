
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShareSettings } from "../types";
import { createDefaultWidgetConfig } from "../utils";
import { toast } from "@/components/ui/use-toast";

export const useWidgetSettings = (chatbotId: string | undefined) => {
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const [widgetConfig, setWidgetConfig] = useState<ShareSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!chatbotId) return;
      
      setIsLoading(true);
      
      try {
        // Fetch the chatbot settings
        const { data: chatbot, error: chatbotError } = await supabase
          .from("chatbots")
          .select("share_settings")
          .eq("id", chatbotId)
          .single();
        
        if (chatbotError) throw chatbotError;
        
        const shareSettings = chatbot?.share_settings as ShareSettings | null;
        
        // If widget_id exists in share_settings, use it
        if (shareSettings?.widget_id) {
          setWidgetId(shareSettings.widget_id);
          setWidgetConfig(shareSettings);
        } else {
          // Generate a new widget ID
          const newWidgetId = crypto.randomUUID();
          setWidgetId(newWidgetId);
          
          // Create default settings with the new widget ID
          const defaultConfig = createDefaultWidgetConfig(newWidgetId);
          setWidgetConfig(defaultConfig);
          
          // Update chatbot with new widget_id and default settings
          await supabase
            .from("chatbots")
            .update({ 
              share_settings: defaultConfig as any
            })
            .eq("id", chatbotId);
        }
      } catch (error) {
        console.error('Error fetching widget settings:', error);
        toast({
          title: "Error",
          description: "Could not load widget settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [chatbotId]);
  
  const updateSettings = async () => {
    if (!widgetConfig || !chatbotId) return;
    
    setIsSaving(true);
    
    try {
      // Update existing settings in the share_settings field
      const { error } = await supabase
        .from("chatbots")
        .update({ 
          share_settings: widgetConfig as any
        })
        .eq("id", chatbotId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Widget settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving widget settings:', error);
      toast({
        title: "Error",
        description: "Could not save widget settings",
        variant: "destructive",
      });
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
    updateSettings
  };
};
