
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
          <Label htmlFor="title">Título</Label>
          <Input 
            id="title" 
            value={widgetConfig?.content?.title || ''} 
            onChange={(e) => onContentChange('title', e.target.value)}
            placeholder="Chat con nosotros"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="subtitle">Subtítulo</Label>
          <Input 
            id="subtitle" 
            value={widgetConfig?.content?.subtitle || ''} 
            onChange={(e) => onContentChange('subtitle', e.target.value)}
            placeholder="Responderemos tus dudas"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="placeholder_text">Texto del placeholder</Label>
          <Input 
            id="placeholder_text" 
            value={widgetConfig?.content?.placeholder_text || ''} 
            onChange={(e) => onContentChange('placeholder_text', e.target.value)}
            placeholder="Escribe un mensaje..."
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="welcome_message">Mensaje de bienvenida</Label>
          <Input 
            id="welcome_message" 
            value={widgetConfig?.content?.welcome_message || ''} 
            onChange={(e) => onContentChange('welcome_message', e.target.value)}
            placeholder="¡Hola! ¿En qué puedo ayudarte hoy?"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="branding" className="block mb-2">Mostrar "Powered by Lovable"</Label>
          <div className="flex items-center">
            <Switch 
              id="branding" 
              checked={widgetConfig?.content?.branding || false}
              onCheckedChange={(checked) => onContentChange('branding', checked)}
            />
            <Label htmlFor="branding" className="ml-2">
              {widgetConfig?.content?.branding ? "Activado" : "Desactivado"}
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentTab;
