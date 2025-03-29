
import React from "react";
import { Button } from "@/components/ui/button";
import { Copy, Eye, CheckCircle2, Code, Frame } from "lucide-react";
import { copyEmbedCode } from "./utils";
import ChatbotPreviewDialog from "@/components/chatbots/ChatbotPreviewDialog";
import { ShareSettings } from "./types";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EmbedCodeTabProps {
  widgetId: string | null;
  widgetConfig: ShareSettings | null;
  chatbotId: string;
}

const EmbedCodeTab: React.FC<EmbedCodeTabProps> = ({ widgetId, widgetConfig, chatbotId }) => {
  const [copied, setCopied] = useState(false);
  const [copiedIframe, setCopiedIframe] = useState(false);
  const [embedType, setEmbedType] = useState<"script" | "iframe">("script");

  const handleCopy = (type: "script" | "iframe") => {
    if (type === "script") {
      const success = copyEmbedCode(widgetId);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      const iframeCode = `<iframe src="https://chatbot-platform.lovable.app/widget/${widgetId}" width="100%" height="600" frameborder="0"></iframe>`;
      try {
        navigator.clipboard.writeText(iframeCode);
        setCopiedIframe(true);
        setTimeout(() => setCopiedIframe(false), 2000);
      } catch (error) {
        console.error('Failed to copy iframe code:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Embed Code</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Copy and paste this code into your website's HTML where you want the chatbot to appear.
        </p>
      </div>

      <Tabs value={embedType} onValueChange={(v) => setEmbedType(v as "script" | "iframe")} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4 w-[250px]">
          <TabsTrigger value="script" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Script
          </TabsTrigger>
          <TabsTrigger value="iframe" className="flex items-center gap-2">
            <Frame className="h-4 w-4" />
            iFrame
          </TabsTrigger>
        </TabsList>

        <TabsContent value="script" className="mt-0 space-y-4">
          <div className="relative">
            <pre className="bg-muted/70 p-5 rounded-lg text-sm overflow-x-auto border border-border/50 font-mono">
              <code>
                {`<script src="https://obiiomoqhpbgaymfphdz.supabase.co/storage/v1/object/public/widget/widget.js" data-widget-id="${widgetId}"></script>`}
              </code>
            </pre>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-3 right-3 p-2 h-8 w-8"
              onClick={() => handleCopy("script")}
              type="button"
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
            <p>
              <strong>Note:</strong> The script embed creates a floating chat widget that appears in the bottom corner of your website.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="iframe" className="mt-0 space-y-4">
          <div className="relative">
            <pre className="bg-muted/70 p-5 rounded-lg text-sm overflow-x-auto border border-border/50 font-mono">
              <code>
                {`<iframe src="https://chatbot-platform.lovable.app/widget/${widgetId}" width="100%" height="600" frameborder="0"></iframe>`}
              </code>
            </pre>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-3 right-3 p-2 h-8 w-8"
              onClick={() => handleCopy("iframe")}
              type="button"
            >
              {copiedIframe ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
            <p>
              <strong>Note:</strong> The iframe embed creates a fixed chat window within your website's content.
            </p>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="bg-muted/30 rounded-lg p-6 border border-dashed border-muted">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h4 className="text-base font-medium">Preview Your Widget</h4>
            <p className="text-sm text-muted-foreground mt-1">
              See how your chatbot will appear when embedded on your website.
            </p>
          </div>
          
          <ChatbotPreviewDialog 
            chatbotId={chatbotId}
            widgetConfig={widgetConfig}
          >
            <Button variant="outline" size="sm" className="gap-2 group whitespace-nowrap">
              <Eye className="h-4 w-4 group-hover:animate-pulse" /> 
              Preview Widget
            </Button>
          </ChatbotPreviewDialog>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-blue-100 rounded-lg p-6">
        <h4 className="text-base font-medium text-blue-800 mb-2">
          Widget Visibility
        </h4>
        <p className="text-sm text-blue-700 mb-4">
          Make sure your widget is <strong>enabled</strong> for it to be accessible publicly. 
          Check the "enabled" setting in the widget configuration.
        </p>
        <div className="flex flex-col gap-2 text-sm text-blue-700">
          <p className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Your widget is public and doesn't require authentication
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Domain restrictions are optional and can be configured in the Access tab
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmbedCodeTab;
