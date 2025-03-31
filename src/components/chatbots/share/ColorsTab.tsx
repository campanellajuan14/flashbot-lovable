
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ShareSettings } from "./types";

interface ColorsTabProps {
  widgetConfig: ShareSettings | null;
  onColorChange: (key: keyof NonNullable<ShareSettings['colors']>, value: string) => void;
}

const ColorField = ({ 
  id, 
  label, 
  value, 
  onChange, 
  description 
}: { 
  id: string, 
  label: string, 
  value: string, 
  onChange: (value: string) => void,
  description?: string 
}) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="font-medium">{label}</Label>
    <div className="flex gap-3 items-center">
      <div className="relative">
        <div 
          className="w-10 h-10 rounded-md border border-border overflow-hidden"
          style={{ backgroundColor: value }}
        ></div>
        <Input 
          id={id} 
          type="color" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-10 h-10"
        />
      </div>
      <Input 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-xs"
      />
    </div>
    {description && <p className="text-xs text-muted-foreground">{description}</p>}
  </div>
);

const ColorsTab: React.FC<ColorsTabProps> = ({ widgetConfig, onColorChange }) => {
  if (!widgetConfig) return null;

  // This function handles the hideBackground toggle
  const handleHideBackgroundChange = (checked: boolean) => {
    if (widgetConfig) {
      if (!widgetConfig.appearance) widgetConfig.appearance = {};
      widgetConfig.appearance.hideBackground = checked;
      
      // If hiding background, make all backgrounds transparent
      if (checked) {
        onColorChange('background', 'transparent');
      } else {
        // Restore default background color
        onColorChange('background', '#ffffff');
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Widget Colors</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Customize the colors of your chat widget to match your brand.
        </p>
      </div>
      
      <div className="flex items-center space-x-2 mb-4">
        <Switch
          id="hide-background"
          checked={widgetConfig?.appearance?.hideBackground || false}
          onCheckedChange={handleHideBackgroundChange}
        />
        <Label htmlFor="hide-background">Hide widget background</Label>
        <span className="text-xs text-muted-foreground ml-2">(Only show messages without container)</span>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <ColorField 
          id="primary" 
          label="Primary Color" 
          value={widgetConfig?.colors?.primary || '#2563eb'}
          onChange={(value) => onColorChange('primary', value)}
          description="Used for header background and button"
        />
        
        <ColorField 
          id="text" 
          label="Text Color" 
          value={widgetConfig?.colors?.text || '#333333'}
          onChange={(value) => onColorChange('text', value)}
          description="Main text color throughout the widget"
        />
        
        <ColorField 
          id="background" 
          label="Background Color" 
          value={widgetConfig?.colors?.background || '#ffffff'}
          onChange={(value) => onColorChange('background', value)}
          description="Main widget background"
        />
        
        <ColorField 
          id="user_bubble" 
          label="User Message Bubble" 
          value={widgetConfig?.colors?.user_bubble || '#2563eb'}
          onChange={(value) => onColorChange('user_bubble', value)}
          description="Background color for user messages"
        />
        
        <ColorField 
          id="bot_bubble" 
          label="Chatbot Message Bubble" 
          value={widgetConfig?.colors?.bot_bubble || '#f1f0f0'}
          onChange={(value) => onColorChange('bot_bubble', value)}
          description="Background color for chatbot responses"
        />
      </div>
      
      <div className="pt-4 bg-muted/30 p-5 rounded-lg mt-6 border border-dashed border-muted">
        <h4 className="font-medium mb-2">Color Preview</h4>
        <div 
          className="flex flex-col gap-3"
          style={{ 
            background: widgetConfig?.appearance?.hideBackground ? 'transparent' : (widgetConfig?.colors?.background || '#ffffff')
          }}
        >
          {!widgetConfig?.appearance?.hideBackground && (
            <div 
              style={{ 
                background: widgetConfig?.colors?.primary || '#2563eb',
                color: '#ffffff',
                borderRadius: '8px 8px 8px 0',
                padding: '12px',
                maxWidth: '100%'
              }}
            >
              Header Background
            </div>
          )}
          <div className="space-y-3">
            <div 
              style={{ 
                background: widgetConfig?.colors?.bot_bubble || '#f1f0f0',
                color: widgetConfig?.colors?.text || '#333333',
                borderRadius: '8px 8px 8px 0',
                padding: '8px 12px',
                maxWidth: '80%',
                alignSelf: 'flex-start'
              }}
            >
              Chatbot message bubble
            </div>
            <div 
              style={{ 
                background: widgetConfig?.colors?.user_bubble || '#2563eb',
                color: '#ffffff',
                borderRadius: '8px 8px 0 8px',
                padding: '8px 12px',
                maxWidth: '80%',
                marginLeft: 'auto'
              }}
            >
              User message bubble
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorsTab;
