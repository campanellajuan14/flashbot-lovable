
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ShareSettings } from "./types";

interface ContentTabProps {
  widgetConfig: ShareSettings | null;
  onContentChange: (key: keyof NonNullable<ShareSettings['content']>, value: any) => void;
}

const ContentTab: React.FC<ContentTabProps> = ({ widgetConfig, onContentChange }) => {
  if (!widgetConfig) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input 
            id="title" 
            value={widgetConfig?.content?.title || ''} 
            onChange={(e) => onContentChange('title', e.target.value)}
            placeholder="Chat with us"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input 
            id="subtitle" 
            value={widgetConfig?.content?.subtitle || ''} 
            onChange={(e) => onContentChange('subtitle', e.target.value)}
            placeholder="We'll answer your questions"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="placeholder_text">Placeholder text</Label>
          <Input 
            id="placeholder_text" 
            value={widgetConfig?.content?.placeholder_text || ''} 
            onChange={(e) => onContentChange('placeholder_text', e.target.value)}
            placeholder="Type a message..."
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="welcome_message">Welcome message</Label>
          <Textarea 
            id="welcome_message" 
            value={widgetConfig?.content?.welcome_message || ''} 
            onChange={(e) => onContentChange('welcome_message', e.target.value)}
            placeholder="Hi! How can I help you today?"
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            This message will be shown at the start of the conversation. If the chatbot has a custom greeting configured, that will take priority.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="branding" className="block mb-2">Show "Powered by Lovable"</Label>
          <div className="flex items-center">
            <Switch 
              id="branding" 
              checked={widgetConfig?.content?.branding || false}
              onCheckedChange={(checked) => onContentChange('branding', checked)}
            />
            <Label htmlFor="branding" className="ml-2">
              {widgetConfig?.content?.branding ? "Enabled" : "Disabled"}
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentTab;
