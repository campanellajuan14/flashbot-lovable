
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import ChatbotPreviewDialog from "@/components/chatbots/ChatbotPreviewDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShareSettings as ShareSettingsType } from "./types";
import { createDefaultWidgetConfig, saveWidgetSettings } from "./utils";
import EmbedCodeTab from "./EmbedCodeTab";
import AppearanceTab from "./AppearanceTab";
import ContentTab from "./ContentTab";
import ColorsTab from "./ColorsTab";
import RestrictionsTab from "./RestrictionsTab";

const ShareSettings = () => {
  const { id: chatbotId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const [widgetConfig, setWidgetConfig] = useState<ShareSettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("embed");
  const [isSaving, setIsSaving] = useState(false);

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

        const shareSettings = data?.share_settings as ShareSettingsType | null;

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
            setWidgetConfig(updatedData.share_settings as ShareSettingsType);
          }
        }
      } catch (error) {
        console.error("Error fetching share settings:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las configuraciones de compartir",
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
  };

  const handleColorChange = (colorKey: keyof NonNullable<ShareSettingsType['colors']>, value: string) => {
    if (!widgetConfig) return;
    
    const newConfig = { ...widgetConfig };
    if (!newConfig.colors) newConfig.colors = {};
    newConfig.colors[colorKey] = value;
    setWidgetConfig(newConfig);
  };

  const handleContentChange = (contentKey: keyof NonNullable<ShareSettingsType['content']>, value: any) => {
    if (!widgetConfig) return;
    
    const newConfig = { ...widgetConfig };
    if (!newConfig.content) newConfig.content = {};
    
    if (contentKey === 'branding' && typeof value === 'boolean') {
      newConfig.content.branding = value;
    } else if (typeof value === 'string') {
      (newConfig.content as any)[contentKey] = value;
    }
    
    setWidgetConfig(newConfig);
  };

  const handleAppearanceChange = (key: keyof NonNullable<ShareSettingsType['appearance']>, value: any) => {
    if (!widgetConfig) return;
    
    const newConfig = { ...widgetConfig };
    if (!newConfig.appearance) newConfig.appearance = {};
    
    if ((key === 'border_radius' || key === 'width' || key === 'height' || key === 'offset_x' || key === 'offset_y' || key === 'z_index') && typeof value === 'string') {
      (newConfig.appearance as any)[key] = parseInt(value, 10);
    } else if (key === 'box_shadow' && typeof value === 'boolean') {
      newConfig.appearance.box_shadow = value;
    } else if (typeof value === 'string') {
      (newConfig.appearance as any)[key] = value;
    }
    
    setWidgetConfig(newConfig);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Widget para tu sitio web</h3>
                <p className="text-sm text-muted-foreground">
                  Configura y obtén el código para incrustar el chatbot en tu sitio web
                </p>
              </div>
              
              <div className="flex gap-2">
                <ChatbotPreviewDialog
                  chatbotId={chatbotId || ''}
                  widgetConfig={widgetConfig}
                />
              </div>
            </div>
            
            {isLoading ? (
              <div className="h-[100px] flex items-center justify-center">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <>
                <Tabs 
                  defaultValue="embed" 
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full mt-4"
                >
                  <TabsList className="grid grid-cols-5 mb-4">
                    <TabsTrigger value="embed">Código</TabsTrigger>
                    <TabsTrigger value="appearance">Apariencia</TabsTrigger>
                    <TabsTrigger value="content">Contenido</TabsTrigger>
                    <TabsTrigger value="colors">Colores</TabsTrigger>
                    <TabsTrigger value="restrictions">Restricciones</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="embed">
                    <EmbedCodeTab 
                      widgetId={widgetId} 
                      widgetConfig={widgetConfig} 
                      chatbotId={chatbotId || ''}
                    />
                  </TabsContent>
                  
                  <TabsContent value="appearance">
                    <AppearanceTab 
                      widgetConfig={widgetConfig}
                      onAppearanceChange={handleAppearanceChange}
                    />
                  </TabsContent>
                  
                  <TabsContent value="content">
                    <ContentTab 
                      widgetConfig={widgetConfig}
                      onContentChange={handleContentChange}
                    />
                  </TabsContent>
                  
                  <TabsContent value="colors">
                    <ColorsTab 
                      widgetConfig={widgetConfig}
                      onColorChange={handleColorChange}
                    />
                  </TabsContent>
                  
                  <TabsContent value="restrictions">
                    <RestrictionsTab 
                      widgetConfig={widgetConfig}
                      setWidgetConfig={setWidgetConfig}
                    />
                  </TabsContent>
                </Tabs>
                
                <div className="flex justify-end mt-6">
                  <Button 
                    disabled={isSaving} 
                    onClick={updateSettings}
                    className="gap-2"
                  >
                    {isSaving && <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>}
                    Guardar configuración
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShareSettings;
