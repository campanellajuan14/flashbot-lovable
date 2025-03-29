
import React from "react";
import { ShareSettings } from "./types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface ContentTabProps {
  widgetConfig: ShareSettings | null;
  onContentChange: (key: string, value: any) => void;
}

const ContentTab = ({ widgetConfig, onContentChange }: ContentTabProps) => {
  if (!widgetConfig || !widgetConfig.content) return null;
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Text Content</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Customize the text that appears in the chatbot widget
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="flex flex-col gap-2 text-left">
          <Label htmlFor="chatTitle">Chat Title</Label>
          <Input 
            id="chatTitle"
            value={widgetConfig.content.title || ''}
            onChange={(e) => onContentChange('title', e.target.value)}
            placeholder="Chat with us"
            className="max-w-md"
          />
          <p className="text-xs text-muted-foreground">
            The title shown in the header of the chat widget
          </p>
        </div>
        
        <div className="flex flex-col gap-2 text-left">
          <Label htmlFor="chatSubtitle">Chat Subtitle (Optional)</Label>
          <Input 
            id="chatSubtitle"
            value={widgetConfig.content.subtitle || ''}
            onChange={(e) => onContentChange('subtitle', e.target.value)}
            placeholder="Our assistant is here to help you"
            className="max-w-md"
          />
          <p className="text-xs text-muted-foreground">
            A short subtitle displayed under the main title
          </p>
        </div>
        
        <div className="flex flex-col gap-2 text-left">
          <Label htmlFor="welcomeMessage">Welcome Message</Label>
          <Textarea 
            id="welcomeMessage"
            value={widgetConfig.content.welcome_message || ''}
            onChange={(e) => onContentChange('welcome_message', e.target.value)}
            placeholder="Hello! How can I help you today?"
            className="resize-y max-w-md"
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            The first message shown to your users
          </p>
        </div>
        
        <div className="flex flex-col gap-2 text-left">
          <Label htmlFor="placeholderText">Input Placeholder</Label>
          <Input 
            id="placeholderText"
            value={widgetConfig.content.placeholder_text || ''}
            onChange={(e) => onContentChange('placeholder_text', e.target.value)}
            placeholder="Type your message here..."
            className="max-w-md"
          />
          <p className="text-xs text-muted-foreground">
            Text shown in the message input when empty
          </p>
        </div>
        
        <div className="space-y-3 pt-2 text-left">
          <div className="flex items-start space-x-3">
            <Switch 
              id="branding"
              checked={widgetConfig.content.branding || false}
              onCheckedChange={(checked) => onContentChange('branding', checked)}
            />
            <div>
              <Label 
                htmlFor="branding" 
                className="text-base cursor-pointer inline-block mb-1"
              >
                Branding
              </Label>
              <p className="text-sm text-muted-foreground">
                Show "Powered by Chatsimp" footer at the bottom of the chat window
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentTab;
