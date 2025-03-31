
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";

// Tabs
import AppearanceTab from "./AppearanceTab";
import ColorsTab from "./ColorsTab";
import ContentTab from "./ContentTab";
import EmbedCodeTab from "./EmbedCodeTab";
import RestrictionsTab from "./RestrictionsTab";

// Types
import { ShareSettings } from "./types";

// Hooks
import { useWidgetSettings } from "./hooks/useWidgetSettings";
import { useWidgetConfigHandlers } from "./hooks/useWidgetConfigHandlers";

const ShareSettingsComponent = () => {
  const { id: chatbotId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("embed");
  const [isEnabled, setIsEnabled] = useState(false);
  
  // Get widget settings from hooks
  const { widgetConfig, isLoading, error, saveWidgetConfig } = useWidgetSettings(chatbotId || "");
  const { handleColorChange, handleContentChange, handleAppearanceChange } = useWidgetConfigHandlers(widgetConfig, (newConfig) => {
    // This is called when a handler updates the widget config
    saveWidgetConfig(newConfig);
  });

  // Set initial enabled state from config when it loads
  useEffect(() => {
    if (widgetConfig) {
      setIsEnabled(widgetConfig.enabled || false);
    }
  }, [widgetConfig]);

  const handleEnabledChange = async (checked: boolean) => {
    setIsEnabled(checked);
    if (widgetConfig) {
      const updatedConfig = { ...widgetConfig, enabled: checked };
      await saveWidgetConfig(updatedConfig);
      
      toast(checked ? "Widget enabled" : "Widget disabled", {
        description: checked 
          ? "Your chatbot widget is now available for embedding." 
          : "Your chatbot widget has been disabled.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading widget settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="rounded-full h-8 w-8 bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
          !
        </div>
        <p className="mt-4 text-destructive">Error loading widget settings</p>
        <p className="text-muted-foreground text-sm mt-2">{error}</p>
      </div>
    );
  }

  if (!chatbotId) {
    return (
      <div className="p-6 text-center">
        <p>No chatbot selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-0.5">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">Widget Embed</h2>
            {isEnabled ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="secondary">Disabled</Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Configure and embed your chatbot on your website.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="enabled" checked={isEnabled} onCheckedChange={handleEnabledChange} />
          <Label htmlFor="enabled">
            {isEnabled ? "Widget Enabled" : "Widget Disabled"}
          </Label>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 sm:grid-cols-5 w-full">
          <TabsTrigger value="embed">Embed Code</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="restrictions" className="hidden sm:block">Restrictions</TabsTrigger>
        </TabsList>

        <TabsContent value="embed" className="space-y-4">
          <EmbedCodeTab 
            widgetId={widgetConfig?.widget_id || null} 
            widgetConfig={widgetConfig} 
            chatbotId={chatbotId}
            onAppearanceChange={handleAppearanceChange}
          />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <AppearanceTab 
            widgetConfig={widgetConfig}
            onAppearanceChange={handleAppearanceChange}
          />
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <ColorsTab 
            widgetConfig={widgetConfig}
            onColorChange={handleColorChange}
          />
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <ContentTab 
            widgetConfig={widgetConfig}
            onContentChange={handleContentChange}
          />
        </TabsContent>

        <TabsContent value="restrictions" className="space-y-4">
          <RestrictionsTab 
            widgetConfig={widgetConfig}
            saveWidgetConfig={saveWidgetConfig}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShareSettingsComponent;
