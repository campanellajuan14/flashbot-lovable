
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
        // First, fetch the chatbot to get the widget_id
        const { data: chatbot, error: chatbotError } = await supabase
          .from("chatbots")
          .select("widget_id")
          .eq("id", chatbotId)
          .single();
        
        if (chatbotError) throw chatbotError;
        
        // If widget_id exists, fetch settings
        if (chatbot?.widget_id) {
          setWidgetId(chatbot.widget_id);
          
          const { data: settings, error: settingsError } = await supabase
            .from("widget_settings")
            .select("*")
            .eq("widget_id", chatbot.widget_id)
            .single();
          
          if (settingsError && settingsError.code !== 'PGRST116') {
            throw settingsError;
          }
          
          if (settings) {
            setWidgetConfig(settings);
          } else {
            // Create default settings
            const defaultConfig = createDefaultWidgetConfig(chatbot.widget_id);
            setWidgetConfig(defaultConfig);
          }
        } else {
          // Generate a new widget ID
          const newWidgetId = crypto.randomUUID();
          setWidgetId(newWidgetId);
          
          // Create default settings
          const defaultConfig = createDefaultWidgetConfig(newWidgetId);
          setWidgetConfig(defaultConfig);
          
          // Update chatbot with new widget_id
          await supabase
            .from("chatbots")
            .update({ widget_id: newWidgetId })
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
    if (!widgetId || !widgetConfig || !chatbotId) return;
    
    setIsSaving(true);
    
    try {
      // Check if settings exist
      const { data: existingSettings, error: checkError } = await supabase
        .from("widget_settings")
        .select("widget_id")
        .eq("widget_id", widgetId)
        .single();
      
      let result;
      
      if (existingSettings) {
        // Update existing settings
        result = await supabase
          .from("widget_settings")
          .update(widgetConfig)
          .eq("widget_id", widgetId);
      } else {
        // Insert new settings
        result = await supabase
          .from("widget_settings")
          .insert({
            ...widgetConfig,
            chatbot_id: chatbotId,
          });
      }
      
      if (result.error) throw result.error;
      
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
