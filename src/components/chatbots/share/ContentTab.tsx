
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Widget Content</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Customize the text and content displayed in your chat widget.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="font-medium">Chat Title</Label>
            <Input 
              id="title" 
              value={widgetConfig?.content?.title || ''} 
              onChange={(e) => onContentChange('title', e.target.value)}
              placeholder="Chat with us"
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground">
              Main heading shown at the top of the chat window
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subtitle" className="font-medium">Subtitle</Label>
            <Input 
              id="subtitle" 
              value={widgetConfig?.content?.subtitle || ''} 
              onChange={(e) => onContentChange('subtitle', e.target.value)}
              placeholder="We'll answer your questions"
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground">
              Optional subheading shown below the title
            </p>
          </div>
        
          <div className="space-y-2">
            <Label htmlFor="placeholder_text" className="font-medium">Input Placeholder</Label>
            <Input 
              id="placeholder_text" 
              value={widgetConfig?.content?.placeholder_text || ''} 
              onChange={(e) => onContentChange('placeholder_text', e.target.value)}
              placeholder="Type a message..."
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground">
              Text shown in the message input field
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="welcome_message" className="font-medium">Welcome Message</Label>
            <Textarea 
              id="welcome_message" 
              value={widgetConfig?.content?.welcome_message || ''} 
              onChange={(e) => onContentChange('welcome_message', e.target.value)}
              placeholder="Hi! How can I help you today?"
              rows={3}
              className="max-w-md resize-none"
            />
            <p className="text-xs text-muted-foreground">
              First message shown from the chatbot when conversation starts
            </p>
          </div>
        </div>
      </div>
      
      <div className="pt-4 border-t border-border/30">
        <div className="space-y-3 max-w-md">
          <Label htmlFor="branding" className="font-medium block">Branding</Label>
          <div className="flex items-center">
            <Switch 
              id="branding" 
              checked={widgetConfig?.content?.branding || false}
              onCheckedChange={(checked) => onContentChange('branding', checked)}
            />
            <Label htmlFor="branding" className="ml-2">
              Show "Powered by Lovable" footer
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Display a small "Powered by Lovable" text at the bottom of the chat window
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContentTab;
