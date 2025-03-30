
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyCheck, Copy, Code, ExternalLink, LayoutTemplate } from "lucide-react";
import { ShareSettings } from "./types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EmbedCodeTabProps {
  widgetId: string | null;
  widgetConfig: ShareSettings | null;
  chatbotId: string;
}

const EmbedCodeTab: React.FC<EmbedCodeTabProps> = ({ widgetId, widgetConfig, chatbotId }) => {
  const [copied, setCopied] = useState(false);
  const [embedType, setEmbedType] = useState("script");
  
  // Base script URL - updated to the new domain
  const scriptBaseUrl = "https://flashbot.lovable.app";
  
  // The ID to use in the embed code - make sure we're using the correct ID
  const embedWidgetId = widgetConfig?.widget_id || widgetId;

  const scriptCode = `<script 
  src="${scriptBaseUrl}/widget.js" 
  data-widget-id="${embedWidgetId || 'missing-id'}"
  async>
</script>`;

  const iframeCode = `<iframe 
  src="${scriptBaseUrl}/widget/${embedWidgetId}"
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

  // Generate the preview URL for the widget with the new domain
  const previewUrl = `${scriptBaseUrl}/widget/${embedWidgetId}`;

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
