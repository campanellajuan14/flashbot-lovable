
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ShareSettings } from "./types";

interface ColorsTabProps {
  widgetConfig: ShareSettings | null;
  onColorChange: (key: keyof NonNullable<ShareSettings['colors']>, value: string) => void;
}

const ColorsTab: React.FC<ColorsTabProps> = ({ widgetConfig, onColorChange }) => {
  if (!widgetConfig) return null;
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="primary">Primary color</Label>
          <div className="flex">
            <Input 
              id="primary" 
              type="color" 
              className="w-12 p-1 h-10"
              value={widgetConfig?.colors?.primary || '#2563eb'} 
              onChange={(e) => onColorChange('primary', e.target.value)}
            />
            <Input 
              className="ml-2 flex-1"
              value={widgetConfig?.colors?.primary || '#2563eb'} 
              onChange={(e) => onColorChange('primary', e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="background">Background color</Label>
          <div className="flex">
            <Input 
              id="background" 
              type="color" 
              className="w-12 p-1 h-10"
              value={widgetConfig?.colors?.background || '#ffffff'} 
              onChange={(e) => onColorChange('background', e.target.value)}
            />
            <Input 
              className="ml-2 flex-1"
              value={widgetConfig?.colors?.background || '#ffffff'} 
              onChange={(e) => onColorChange('background', e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="text">Text color</Label>
          <div className="flex">
            <Input 
              id="text" 
              type="color" 
              className="w-12 p-1 h-10"
              value={widgetConfig?.colors?.text || '#333333'} 
              onChange={(e) => onColorChange('text', e.target.value)}
            />
            <Input 
              className="ml-2 flex-1"
              value={widgetConfig?.colors?.text || '#333333'} 
              onChange={(e) => onColorChange('text', e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="user_bubble">User bubble</Label>
          <div className="flex">
            <Input 
              id="user_bubble" 
              type="color" 
              className="w-12 p-1 h-10"
              value={widgetConfig?.colors?.user_bubble || '#2563eb'} 
              onChange={(e) => onColorChange('user_bubble', e.target.value)}
            />
            <Input 
              className="ml-2 flex-1"
              value={widgetConfig?.colors?.user_bubble || '#2563eb'} 
              onChange={(e) => onColorChange('user_bubble', e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bot_bubble">Chatbot bubble</Label>
          <div className="flex">
            <Input 
              id="bot_bubble" 
              type="color" 
              className="w-12 p-1 h-10"
              value={widgetConfig?.colors?.bot_bubble || '#f1f0f0'} 
              onChange={(e) => onColorChange('bot_bubble', e.target.value)}
            />
            <Input 
              className="ml-2 flex-1"
              value={widgetConfig?.colors?.bot_bubble || '#f1f0f0'} 
              onChange={(e) => onColorChange('bot_bubble', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorsTab;
