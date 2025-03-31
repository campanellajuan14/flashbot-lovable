import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyCheck, Copy, Code, ExternalLink, LayoutTemplate } from "lucide-react";
import { ShareSettings } from "./types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface EmbedCodeTabProps {
  widgetId: string | null;
  widgetConfig: ShareSettings | null;
  chatbotId: string;
  onAppearanceChange: (key: keyof NonNullable<ShareSettings['appearance']>, value: any) => void;
}

const EmbedCodeTab: React.FC<EmbedCodeTabProps> = ({ 
  widgetId, 
  widgetConfig, 
  chatbotId,
  onAppearanceChange
}) => {
  const [copied, setCopied] = useState(false);
  const [embedType, setEmbedType] = useState("script");
  
  // Base script URL - actualizado al nuevo dominio
  const scriptBaseUrl = "https://flashbot.lovable.app";
  
  // The ID to use in the embed code - make sure we're using the correct ID
  const embedWidgetId = widgetConfig?.widget_id || widgetId;
  
  // Parámetro para iframes minimalistas
  const minimalMode = widgetConfig?.appearance?.minimalIframe ? '&minimal=true' : '';

  const scriptCode = `<script 
  src="${scriptBaseUrl}/widget.js" 
  data-widget-id="${embedWidgetId || 'missing-id'}"
  async>
</script>`;

  const iframeCode = `<iframe 
  src="${scriptBaseUrl}/widget/${embedWidgetId}${minimalMode}"
  width="100%" 
  height="600" 
  style="border:none;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1)" 
  allow="microphone"
  title="AI Chat Widget">
</iframe>`;

  const handleCopy = () => {
    const codeToCopy = embedType === "script" ? scriptCode : iframeCode;
    navigator.clipboard.writeText(codeToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate the preview URL for the widget con el nuevo dominio
  const previewUrl = `${scriptBaseUrl}/widget/${embedWidgetId}${minimalMode}`;
  
  // Función para manejar el cambio en el modo minimalista
  const handleMinimalModeChange = (checked: boolean) => {
    onAppearanceChange('minimalIframe', checked);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium flex items-center">
          <Code className="mr-2 h-5 w-5 text-primary" />
          Embed Your Chatbot
        </h3>
        <p className="text-sm text-muted-foreground max-w-lg">
          Copy this code and paste it into your website to add the chatbot widget. Choose between a floating chat button or an inline iframe.
        </p>
      </div>
      
      <Tabs defaultValue="script" value={embedType} onValueChange={setEmbedType} className="w-full">
        <TabsList className="w-full mb-4 grid grid-cols-2">
          <TabsTrigger value="script" className="flex items-center gap-2">
            <Code className="h-4 w-4" /> 
            <span>Floating Widget</span>
          </TabsTrigger>
          <TabsTrigger value="iframe" className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4" /> 
            <span>Embedded iFrame</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="script" className="mt-0">
          <div className="relative">
            <div className="p-3 border rounded-md bg-black">
              <pre className="overflow-x-auto p-2 text-xs text-white font-mono">
                {scriptCode}
              </pre>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <CopyCheck className="h-4 w-4 mr-1" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" /> Copy
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            This adds a floating chat button that opens a chat window when clicked.
          </p>
        </TabsContent>
        
        <TabsContent value="iframe" className="mt-0">
          {embedType === "iframe" && (
            <div className="mb-4 bg-accent/20 p-4 rounded-md border border-accent/30">
              <div className="flex items-center space-x-2">
                <Switch
                  id="minimal-iframe"
                  checked={widgetConfig?.appearance?.minimalIframe || false}
                  onCheckedChange={handleMinimalModeChange}
                />
                <Label htmlFor="minimal-iframe" className="font-medium">Power Integration Mode</Label>
              </div>
              <p className="text-sm text-muted-foreground mt-1 ml-7">
                Shows only messages without header, footer or background, for seamless integration with your website.
              </p>
            </div>
          )}
          <div className="relative">
            <div className="p-3 border rounded-md bg-black">
              <pre className="overflow-x-auto p-2 text-xs text-white font-mono">
                {iframeCode}
              </pre>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <CopyCheck className="h-4 w-4 mr-1" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" /> Copy
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            This embeds the chat directly within your page as an inline element.
          </p>
        </TabsContent>
      </Tabs>

      <div className="bg-muted/30 p-4 rounded-lg border">
        <h4 className="text-sm font-medium mb-2">Widget ID</h4>
        <div className="flex items-center gap-2">
          <code className="bg-muted p-2 rounded text-xs font-mono break-all flex-1">
            {embedWidgetId || 'No widget ID generated yet'}
          </code>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(embedWidgetId || '');
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          This is the unique identifier for your chatbot widget. Keep it safe.
        </p>
      </div>

      <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
        <h4 className="text-sm font-medium mb-2 flex items-center">
          <ExternalLink className="h-4 w-4 mr-2" />
          Preview Your Chatbot
        </h4>
        <p className="text-xs text-muted-foreground mb-3">
          Use this URL to preview how your chatbot will look on your website:
        </p>
        <div className="flex items-center gap-2">
          <code className="bg-muted p-2 rounded text-xs font-mono break-all flex-1">
            {previewUrl}
          </code>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(previewUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(previewUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmbedCodeTab;
