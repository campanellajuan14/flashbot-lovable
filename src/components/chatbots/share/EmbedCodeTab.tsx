
import React from "react";
import { Button } from "@/components/ui/button";
import { Copy, Eye, CheckCircle2 } from "lucide-react";
import { copyEmbedCode } from "./utils";
import ChatbotPreviewDialog from "@/components/chatbots/ChatbotPreviewDialog";
import { ShareSettings } from "./types";
import { useState } from "react";

interface EmbedCodeTabProps {
  widgetId: string | null;
  widgetConfig: ShareSettings | null;
  chatbotId: string;
}

const EmbedCodeTab: React.FC<EmbedCodeTabProps> = ({ widgetId, widgetConfig, chatbotId }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const success = copyEmbedCode(widgetId);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Embed Code</h3>
        <p className="text-sm text-muted-foreground">
          Copy and paste this code into your website's HTML where you want the chatbot to appear.
        </p>
      </div>

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
          onClick={handleCopy}
          type="button"
        >
          {copied ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <div className="bg-muted/30 rounded-lg p-6 border border-dashed border-muted">
        <div className="text-center space-y-4">
          <h4 className="text-base font-medium">Preview Your Widget</h4>
          <p className="text-sm text-muted-foreground">
            See how your chatbot will appear when embedded on your website.
          </p>
          
          <ChatbotPreviewDialog 
            chatbotId={chatbotId}
            widgetConfig={widgetConfig}
          >
            <Button variant="outline" size="lg" className="gap-2 group">
              <Eye className="h-4 w-4 group-hover:animate-pulse" /> 
              Preview Widget
            </Button>
          </ChatbotPreviewDialog>
        </div>
      </div>
    </div>
  );
};

export default EmbedCodeTab;
