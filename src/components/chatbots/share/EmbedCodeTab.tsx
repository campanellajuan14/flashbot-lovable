
import React from "react";
import { Button } from "@/components/ui/button";
import { Copy, Eye } from "lucide-react";
import { copyEmbedCode } from "./utils";
import ChatbotPreviewDialog from "@/components/chatbots/ChatbotPreviewDialog";
import { ShareSettings } from "./types";

interface EmbedCodeTabProps {
  widgetId: string | null;
  widgetConfig: ShareSettings | null;
  chatbotId: string;
}

const EmbedCodeTab: React.FC<EmbedCodeTabProps> = ({ widgetId, widgetConfig, chatbotId }) => {
  return (
    <div className="space-y-4">
      <div className="mt-4 relative">
        <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
          <code>
            {`<script src="https://obiiomoqhpbgaymfphdz.supabase.co/storage/v1/object/public/widget/widget.js" data-widget-id="${widgetId}"></script>`}
          </code>
        </pre>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3"
          onClick={() => copyEmbedCode(widgetId)}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Preview</h4>
        <div className="border rounded-md p-4 bg-muted/50">
          <div className="flex justify-center">
            <ChatbotPreviewDialog 
              chatbotId={chatbotId}
              widgetConfig={widgetConfig}
            >
              <Button variant="outline" size="lg" className="gap-2">
                <Eye className="h-4 w-4" /> See how your chatbot will look
              </Button>
            </ChatbotPreviewDialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbedCodeTab;
