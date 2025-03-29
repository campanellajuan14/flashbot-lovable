
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ShareSettings } from "./types";
import { Laptop, Monitor, Smartphone } from "lucide-react";

interface AppearanceTabProps {
  widgetConfig: ShareSettings | null;
  onAppearanceChange: (key: keyof NonNullable<ShareSettings['appearance']>, value: any) => void;
}

const AppearanceTab: React.FC<AppearanceTabProps> = ({ widgetConfig, onAppearanceChange }) => {
  if (!widgetConfig) return null;
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Widget Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Configure how the widget appears and behaves on your website.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="position" className="font-medium">Position</Label>
            <Select 
              value={widgetConfig?.appearance?.position || 'right'} 
              onValueChange={(value) => onAppearanceChange('position', value)}
            >
              <SelectTrigger id="position" className="w-full">
                <SelectValue placeholder="Select a position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left side of screen</SelectItem>
                <SelectItem value="right">Right side of screen</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Where the widget button appears on the screen</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="initial_state" className="font-medium">Initial State</Label>
            <Select 
              value={widgetConfig?.appearance?.initial_state || 'closed'} 
              onValueChange={(value) => onAppearanceChange('initial_state', value)}
            >
              <SelectTrigger id="initial_state" className="w-full">
                <SelectValue placeholder="Select an initial state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="closed">Closed (button only)</SelectItem>
                <SelectItem value="open">Open (full chat window)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">How the widget appears when the page loads</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="width" className="font-medium">Dimensions</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground w-12">Width</span>
                  <Input 
                    id="width" 
                    type="number" 
                    value={widgetConfig?.appearance?.width || 350} 
                    onChange={(e) => onAppearanceChange('width', e.target.value)}
                    className="flex-1"
                  />
                  <span className="ml-2 text-xs text-muted-foreground">px</span>
                </div>
              </div>
              <div>
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground w-12">Height</span>
                  <Input 
                    id="height" 
                    type="number" 
                    value={widgetConfig?.appearance?.height || 500} 
                    onChange={(e) => onAppearanceChange('height', e.target.value)}
                    className="flex-1"
                  />
                  <span className="ml-2 text-xs text-muted-foreground">px</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="offset_x" className="font-medium">Margin/Offset</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground w-12">Horizontal</span>
                  <Input 
                    id="offset_x" 
                    type="number" 
                    value={widgetConfig?.appearance?.offset_x || 20} 
                    onChange={(e) => onAppearanceChange('offset_x', e.target.value)}
                    className="flex-1"
                  />
                  <span className="ml-2 text-xs text-muted-foreground">px</span>
                </div>
              </div>
              <div>
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground w-12">Vertical</span>
                  <Input 
                    id="offset_y" 
                    type="number" 
                    value={widgetConfig?.appearance?.offset_y || 20} 
                    onChange={(e) => onAppearanceChange('offset_y', e.target.value)}
                    className="flex-1"
                  />
                  <span className="ml-2 text-xs text-muted-foreground">px</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="border_radius" className="font-medium">Border Radius</Label>
            <div className="flex items-center">
              <Input 
                id="border_radius" 
                type="number" 
                value={widgetConfig?.appearance?.border_radius || 10} 
                onChange={(e) => onAppearanceChange('border_radius', e.target.value)}
                className="w-32"
              />
              <span className="ml-2 text-xs text-muted-foreground">px</span>
            </div>
            <p className="text-xs text-muted-foreground">Corner roundness of the widget</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="box_shadow" className="font-medium block mb-2">Shadow Effect</Label>
            <div className="flex items-center">
              <Switch 
                id="box_shadow" 
                checked={widgetConfig?.appearance?.box_shadow || false}
                onCheckedChange={(checked) => onAppearanceChange('box_shadow', checked)}
              />
              <Label htmlFor="box_shadow" className="ml-2">
                {widgetConfig?.appearance?.box_shadow ? "Shadow enabled" : "No shadow"}
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">Adds a subtle shadow to the widget</p>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <div className="bg-muted/30 rounded-lg p-4 border border-dashed border-muted flex items-center gap-4 text-sm text-muted-foreground">
          <Smartphone className="h-5 w-5" />
          <p>The widget will automatically adjust to smaller screens on mobile devices.</p>
        </div>
      </div>
    </div>
  );
};

export default AppearanceTab;
