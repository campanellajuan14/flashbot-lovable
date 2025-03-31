
import { ShareSettings } from "../types";

export const useWidgetConfigHandlers = (
  widgetConfig: ShareSettings | null,
  setWidgetConfig: React.Dispatch<React.SetStateAction<ShareSettings | null>>
) => {
  const handleColorChange = (colorKey: keyof NonNullable<ShareSettings['colors']>, value: string) => {
    if (!widgetConfig) return;
    
    const newConfig = { ...widgetConfig };
    if (!newConfig.colors) newConfig.colors = {};
    newConfig.colors[colorKey] = value;
    setWidgetConfig(newConfig);
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
    
    setWidgetConfig(newConfig);
  };

  const handleAppearanceChange = (key: keyof NonNullable<ShareSettings['appearance']>, value: any) => {
    if (!widgetConfig) return;
    
    const newConfig = { ...widgetConfig };
    if (!newConfig.appearance) newConfig.appearance = {};
    
    if ((key === 'border_radius' || key === 'width' || key === 'height' || key === 'offset_x' || key === 'offset_y' || key === 'z_index') && typeof value === 'string') {
      (newConfig.appearance as any)[key] = parseInt(value, 10);
    } else if ((key === 'box_shadow' || key === 'hideBackground') && typeof value === 'boolean') {
      (newConfig.appearance as any)[key] = value;
    } else if (typeof value === 'string') {
      (newConfig.appearance as any)[key] = value;
    }
    
    setWidgetConfig(newConfig);
  };

  return {
    handleColorChange,
    handleContentChange,
    handleAppearanceChange
  };
};
