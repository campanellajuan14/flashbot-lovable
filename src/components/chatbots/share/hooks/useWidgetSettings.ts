
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ShareSettings } from "../types";
import { createDefaultWidgetConfig } from "../utils";

export const useWidgetSettings = (chatbotId: string | undefined) => {
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const [widgetConfig, setWidgetConfig] = useState<ShareSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!chatbotId) return;

    const fetchShareSettings = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("chatbots")
          .select("share_settings")
          .eq("id", chatbotId)
          .single();

        if (error) throw error;

        const shareSettings = data?.share_settings as ShareSettings | null;

        if (shareSettings?.widget_id) {
          setWidgetId(shareSettings.widget_id);
          setWidgetConfig(shareSettings);
        } else {
          // Generate a widget ID if none exists
          const newWidgetId = `wgt_${Math.random().toString(36).substring(2, 12)}`;
          setWidgetId(newWidgetId);
          
          // Create a new configuration object with the generated widget ID
          const newConfig = createDefaultWidgetConfig(newWidgetId);
          
          // Update the database with the new widget ID
          const { error: updateError } = await supabase
            .from("chatbots")
            .update({
              share_settings: newConfig as unknown as any
            })
            .eq("id", chatbotId);

          if (updateError) throw updateError;
          
          // Fetch the updated settings
          const { data: updatedData } = await supabase
            .from("chatbots")
            .select("share_settings")
            .eq("id", chatbotId)
            .single();
            
          if (updatedData?.share_settings) {
            setWidgetConfig(updatedData.share_settings as ShareSettings);
          }
        }
      } catch (error) {
        console.error("Error fetching share settings:", error);
        toast({
          title: "Error",
          description: "Could not load sharing settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchShareSettings();
  }, [chatbotId, toast]);

  const updateSettings = async () => {
    if (!chatbotId || !widgetConfig) return;
    
    setIsSaving(true);
    const success = await saveWidgetSettings(chatbotId, widgetConfig);
    setIsSaving(false);
    
    return success;
  };

  // Function to save widget settings to the database
  const saveWidgetSettings = async (chatbotId: string, widgetConfig: ShareSettings) => {
    try {
      const { error } = await supabase
        .from("chatbots")
        .update({
          share_settings: widgetConfig as unknown as any
        })
        .eq("id", chatbotId);

      if (error) throw error;
      
      toast({
        title: "Configuración guardada",
        description: "La configuración del widget se ha guardado correctamente",
      });
      
      return true;
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
      return false;
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
