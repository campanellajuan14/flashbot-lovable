
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Widget for your website</h3>
                <p className="text-sm text-muted-foreground">
                  Configure and get the code to embed the chatbot on your website
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
                    <TabsTrigger value="embed">Code</TabsTrigger>
                    <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="colors">Colors</TabsTrigger>
                    <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
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
                    Save configuration
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
