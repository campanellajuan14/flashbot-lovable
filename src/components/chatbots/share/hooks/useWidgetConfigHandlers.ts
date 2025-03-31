
import { ShareSettings } from "../types";

export const useWidgetConfigHandlers = (
  widgetConfig: ShareSettings | null,
  saveWidgetConfig: (newConfig: ShareSettings) => void
) => {
  const handleColorChange = (colorKey: keyof NonNullable<ShareSettings['colors']>, value: string) => {
    if (!widgetConfig) return;
    
    const newConfig = { ...widgetConfig };
    if (!newConfig.colors) newConfig.colors = {};
    newConfig.colors[colorKey] = value;
    saveWidgetConfig(newConfig);
  };

  const handleContentChange = (contentKey: keyof NonNullable<ShareSettings['content']>, value: any) => {
    if (!widgetConfig) return;
    
    const newConfig = { ...widgetConfig };
    if (!newConfig.content) newConfig.content = {};
    
    if (contentKey === 'branding' && typeof value === 'boolean') {
      newConfig.content.branding = value;
    } else if (typeof value === 'string') {
      (newConfig.content as any)[contentKey] = value;
    }
    
    saveWidgetConfig(newConfig);
  };

  const handleAppearanceChange = (key: keyof NonNullable<ShareSettings['appearance']>, value: any) => {
    if (!widgetConfig) return;
    
    console.log(`Appearance change: ${key} = ${value}`);
    
    const newConfig = { ...widgetConfig };
    if (!newConfig.appearance) newConfig.appearance = {};
    
    if ((key === 'border_radius' || key === 'width' || key === 'height' || key === 'offset_x' || key === 'offset_y' || key === 'z_index') && typeof value === 'string') {
      (newConfig.appearance as any)[key] = parseInt(value, 10);
    } else if ((key === 'box_shadow' || key === 'hideBackground' || key === 'minimalIframe') && typeof value === 'boolean') {
      (newConfig.appearance as any)[key] = value;
    } else if (typeof value === 'string') {
      (newConfig.appearance as any)[key] = value;
    }
    
    saveWidgetConfig(newConfig);
  };

  return {
    handleColorChange,
    handleContentChange,
    handleAppearanceChange
  };
};
