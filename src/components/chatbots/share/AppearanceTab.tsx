
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ShareSettings } from "./types";

interface AppearanceTabProps {
  widgetConfig: ShareSettings | null;
  onAppearanceChange: (key: keyof NonNullable<ShareSettings['appearance']>, value: any) => void;
}

const AppearanceTab: React.FC<AppearanceTabProps> = ({ widgetConfig, onAppearanceChange }) => {
  if (!widgetConfig) return null;
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="position">Position</Label>
          <Select 
            value={widgetConfig?.appearance?.position || 'right'} 
            onValueChange={(value) => onAppearanceChange('position', value)}
          >
            <SelectTrigger id="position">
              <SelectValue placeholder="Select a position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="initial_state">Initial state</Label>
          <Select 
            value={widgetConfig?.appearance?.initial_state || 'closed'} 
            onValueChange={(value) => onAppearanceChange('initial_state', value)}
          >
            <SelectTrigger id="initial_state">
              <SelectValue placeholder="Select an initial state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="open">Open</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="width">Width (px)</Label>
          <Input 
            id="width" 
            type="number" 
            value={widgetConfig?.appearance?.width || 350} 
            onChange={(e) => onAppearanceChange('width', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="height">Height (px)</Label>
          <Input 
            id="height" 
            type="number" 
            value={widgetConfig?.appearance?.height || 500} 
            onChange={(e) => onAppearanceChange('height', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="border_radius">Border radius (px)</Label>
          <Input 
            id="border_radius" 
            type="number" 
            value={widgetConfig?.appearance?.border_radius || 10} 
            onChange={(e) => onAppearanceChange('border_radius', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="offset_x">Horizontal margin (px)</Label>
          <Input 
            id="offset_x" 
            type="number" 
            value={widgetConfig?.appearance?.offset_x || 20} 
            onChange={(e) => onAppearanceChange('offset_x', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="offset_y">Vertical margin (px)</Label>
          <Input 
            id="offset_y" 
            type="number" 
            value={widgetConfig?.appearance?.offset_y || 20} 
            onChange={(e) => onAppearanceChange('offset_y', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="box_shadow" className="block mb-2">Shadow</Label>
          <div className="flex items-center">
            <Switch 
              id="box_shadow" 
              checked={widgetConfig?.appearance?.box_shadow || false}
              onCheckedChange={(checked) => onAppearanceChange('box_shadow', checked)}
            />
            <Label htmlFor="box_shadow" className="ml-2">
              {widgetConfig?.appearance?.box_shadow ? "Enabled" : "Disabled"}
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceTab;
