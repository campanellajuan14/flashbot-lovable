
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyCheck, Copy, Code, ExternalLink } from "lucide-react";
import { ShareSettings } from "./types";

interface EmbedCodeTabProps {
  widgetId: string | null;
  widgetConfig: ShareSettings | null;
  chatbotId: string;
}

const EmbedCodeTab: React.FC<EmbedCodeTabProps> = ({ widgetId, widgetConfig, chatbotId }) => {
  const [copied, setCopied] = useState(false);
  
  // Base script URL - in production this would come from your config
  const scriptBaseUrl = "https://chatbot-platform.lovable.app";
  
  // The ID to use in the embed code - make sure we're using the correct ID
  const embedWidgetId = widgetConfig?.widget_id || widgetId;

  const embedCode = `<script 
  src="${scriptBaseUrl}/widget.js" 
  data-widget-id="${embedWidgetId || 'missing-id'}"
  async>
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate the preview URL for the widget
  const previewUrl = `${window.location.origin}/widget/${embedWidgetId}`;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium flex items-center">
          <Code className="mr-2 h-5 w-5 text-primary" />
          Embed Your Chatbot
        </h3>
        <p className="text-sm text-muted-foreground max-w-lg">
          Copy this code and paste it into your website to add the chatbot widget.
        </p>
      </div>
      
      <div className="relative">
        <div className="p-3 border rounded-md bg-black">
          <pre className="overflow-x-auto p-2 text-xs text-white font-mono">
            {embedCode}
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
