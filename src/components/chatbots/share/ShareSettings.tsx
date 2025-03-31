
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Palette, Layout, Type, ShieldAlert, Save } from "lucide-react";
import ChatbotPreviewDialog from "@/components/chatbots/ChatbotPreviewDialog";
import EmbedCodeTab from "./EmbedCodeTab";
import AppearanceTab from "./AppearanceTab";
import ContentTab from "./ContentTab";
import ColorsTab from "./ColorsTab";
import RestrictionsTab from "./RestrictionsTab";
import { useWidgetSettings } from "./hooks/useWidgetSettings";
import { useWidgetConfigHandlers } from "./hooks/useWidgetConfigHandlers";

const ShareSettings = () => {
  const { id: chatbotId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("embed");
  
  // Use our custom hooks
  const { 
    widgetId, 
    widgetConfig, 
    setWidgetConfig, 
    isLoading, 
    isSaving, 
    updateSettings 
  } = useWidgetSettings(chatbotId);

  const {
    handleColorChange,
    handleContentChange,
    handleAppearanceChange
  } = useWidgetConfigHandlers(widgetConfig, setWidgetConfig);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border border-border/50 shadow-sm">
        <CardContent className="p-0">
          <div className="bg-accent/20 p-4 border-b border-border/30">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Chatbot Widget Configuration</h3>
              
              <div className="flex gap-2">
                <ChatbotPreviewDialog
                  chatbotId={chatbotId || ''}
                  widgetConfig={widgetConfig}
                />
              </div>
            </div>
          </div>
            
          {isLoading ? (
            <div className="h-[250px] flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="py-4 px-5">
              <Tabs 
                defaultValue="embed" 
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-5 mb-6 bg-muted/50 p-1 rounded-lg">
                  <TabsTrigger 
                    value="embed" 
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Code className="h-4 w-4" />
                    <span className="hidden sm:inline">Embed</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="appearance" 
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Layout className="h-4 w-4" />
                    <span className="hidden sm:inline">Layout</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="content" 
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Type className="h-4 w-4" />
                    <span className="hidden sm:inline">Text</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="colors" 
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Palette className="h-4 w-4" />
                    <span className="hidden sm:inline">Colors</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="restrictions" 
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    <span className="hidden sm:inline">Access</span>
                  </TabsTrigger>
                </TabsList>
                
                <div className="bg-accent/10 rounded-lg p-5 transition-all duration-200 min-h-[350px]">
                  <TabsContent value="embed" className="mt-0 animate-in fade-in-50 duration-300">
                    <EmbedCodeTab 
                      widgetId={widgetId} 
                      widgetConfig={widgetConfig} 
                      chatbotId={chatbotId || ''}
                    />
                  </TabsContent>
                  
                  <TabsContent value="appearance" className="mt-0 animate-in fade-in-50 duration-300">
                    <AppearanceTab 
                      widgetConfig={widgetConfig}
                      onAppearanceChange={handleAppearanceChange}
                    />
                  </TabsContent>
                  
                  <TabsContent value="content" className="mt-0 animate-in fade-in-50 duration-300">
                    <ContentTab 
                      widgetConfig={widgetConfig}
                      onContentChange={handleContentChange}
                    />
                  </TabsContent>
                  
                  <TabsContent value="colors" className="mt-0 animate-in fade-in-50 duration-300">
                    <ColorsTab 
                      widgetConfig={widgetConfig}
                      onColorChange={handleColorChange}
                    />
                  </TabsContent>
                  
                  <TabsContent value="restrictions" className="mt-0 animate-in fade-in-50 duration-300">
                    <RestrictionsTab 
                      widgetConfig={widgetConfig}
                      setWidgetConfig={setWidgetConfig}
                    />
                  </TabsContent>
                </div>
              </Tabs>
              
              <div className="flex justify-start mt-6">
                <Button 
                  disabled={isSaving} 
                  onClick={updateSettings}
                  className="gap-2 relative overflow-hidden group"
                  type="button"
                >
                  {isSaving && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary">
                      <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full"></div>
                    </div>
                  )}
                  <Save className={`h-4 w-4 ${isSaving ? 'opacity-0' : 'opacity-100'}`} />
                  <span className={isSaving ? 'opacity-0' : 'opacity-100'}>Save configuration</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShareSettings;
