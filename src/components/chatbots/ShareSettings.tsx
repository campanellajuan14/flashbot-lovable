
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import ChatbotPreviewDialog from "@/components/chatbots/ChatbotPreviewDialog";
import { Button } from "@/components/ui/button";
import { Copy, Eye, Settings } from "lucide-react";
import { Json } from "@/integrations/supabase/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define the shape of the widget configuration
export interface ShareSettings {
  widget_id?: string;
  enabled?: boolean;
  appearance?: {
    position?: string;
    theme?: string;
    initial_state?: string;
    offset_x?: number;
    offset_y?: number;
    width?: number;
    height?: number;
    border_radius?: number;
    box_shadow?: boolean;
    z_index?: number;
  };
  content?: {
    title?: string;
    subtitle?: string;
    placeholder_text?: string;
    welcome_message?: string;
    branding?: boolean;
  };
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
    user_bubble?: string;
    bot_bubble?: string;
    links?: string;
  };
  behavior?: {
    auto_open?: boolean;
    auto_open_delay?: number;
    persist_conversation?: boolean;
    save_conversation_id?: boolean;
  };
  restrictions?: {
    allowed_domains?: string[];
  };
}

const ShareSettings = () => {
  const { id: chatbotId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const [widgetConfig, setWidgetConfig] = useState<ShareSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("embed");
  const [allowedDomain, setAllowedDomain] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!chatbotId) return;

    const fetchShareSettings = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("chatbots")
          .select("share_settings")
          .eq("id", chatbotId)
          .single();

        if (error) throw error;

        const shareSettings = data?.share_settings as ShareSettings | null;

        if (shareSettings?.widget_id) {
          setWidgetId(shareSettings.widget_id);
          setWidgetConfig(shareSettings);
        } else {
          // Generate a widget ID if none exists
          const newWidgetId = `wgt_${Math.random().toString(36).substring(2, 12)}`;
          setWidgetId(newWidgetId);
          
          // Create a new configuration object with the generated widget ID
          const newConfig: ShareSettings = {
            widget_id: newWidgetId,
            enabled: true,
            appearance: {
              position: "right",
              theme: "light",
              initial_state: "closed",
              offset_x: 20,
              offset_y: 20,
              width: 350,
              height: 500,
              border_radius: 10,
              box_shadow: true,
              z_index: 9999
            },
            content: {
              title: "Chat con nosotros",
              subtitle: "Responderemos tus dudas",
              placeholder_text: "Escribe un mensaje...",
              welcome_message: "¡Hola! ¿En qué puedo ayudarte hoy?",
              branding: true
            },
            colors: {
              primary: "#2563eb",
              secondary: "#4b5563",
              background: "#ffffff",
              text: "#333333",
              user_bubble: "#2563eb",
              bot_bubble: "#f1f0f0",
              links: "#0078ff"
            },
            behavior: {
              auto_open: false,
              auto_open_delay: 3000,
              persist_conversation: true,
              save_conversation_id: true
            },
            restrictions: {
              allowed_domains: []
            }
          };
          
          // Update the database with the new widget ID
          // Here's the fix: explicitly cast newConfig to Json when updating
          const { error: updateError } = await supabase
            .from("chatbots")
            .update({
              share_settings: newConfig as unknown as Json
            })
            .eq("id", chatbotId);

          if (updateError) throw updateError;
          
          // Fetch the updated settings
          const { data: updatedData } = await supabase
            .from("chatbots")
            .select("share_settings")
            .eq("id", chatbotId)
            .single();
            
          if (updatedData?.share_settings) {
            setWidgetConfig(updatedData.share_settings as ShareSettings);
          }
        }
      } catch (error) {
        console.error("Error fetching share settings:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las configuraciones de compartir",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchShareSettings();
  }, [chatbotId, toast]);

  const copyEmbedCode = () => {
    if (!widgetId) return;
    
    const embedCode = `<script src="https://obiiomoqhpbgaymfphdz.supabase.co/storage/v1/object/public/widget/widget.js" data-widget-id="${widgetId}"></script>`;
    
    navigator.clipboard.writeText(embedCode)
      .then(() => {
        toast({
          title: "Código copiado",
          description: "El código de incrustación se ha copiado al portapapeles",
        });
      })
      .catch((error) => {
        console.error("Error copying embed code:", error);
        toast({
          title: "Error",
          description: "No se pudo copiar el código. Inténtalo de nuevo.",
          variant: "destructive",
        });
      });
  };

  const updateSettings = async () => {
    if (!chatbotId || !widgetConfig) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("chatbots")
        .update({
          share_settings: widgetConfig as unknown as Json
        })
        .eq("id", chatbotId);

      if (error) throw error;
      
      toast({
        title: "Configuración guardada",
        description: "La configuración del widget se ha guardado correctamente",
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addAllowedDomain = () => {
    if (!allowedDomain || !widgetConfig) return;
    
    const domain = allowedDomain.trim().toLowerCase();
    if (domain === "") return;
    
    // Validate domain format (basic check)
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/;
    if (!domainRegex.test(domain)) {
      toast({
        title: "Formato inválido",
        description: "Por favor ingresa un dominio válido (ejemplo: midominio.com)",
        variant: "destructive",
      });
      return;
    }
    
    // Check if domain already exists
    if (widgetConfig.restrictions?.allowed_domains?.includes(domain)) {
      toast({
        title: "Dominio duplicado",
        description: "Este dominio ya está en la lista",
        variant: "destructive",
      });
      return;
    }
    
    // Add domain to list
    const newConfig = { ...widgetConfig };
    if (!newConfig.restrictions) newConfig.restrictions = {};
    if (!newConfig.restrictions.allowed_domains) newConfig.restrictions.allowed_domains = [];
    
    newConfig.restrictions.allowed_domains.push(domain);
    setWidgetConfig(newConfig);
    setAllowedDomain("");
  };

  const removeDomain = (domain: string) => {
    if (!widgetConfig?.restrictions?.allowed_domains) return;
    
    const newConfig = { ...widgetConfig };
    newConfig.restrictions.allowed_domains = newConfig.restrictions.allowed_domains.filter(d => d !== domain);
    setWidgetConfig(newConfig);
  };

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
    } else if (key === 'box_shadow' && typeof value === 'boolean') {
      newConfig.appearance.box_shadow = value;
    } else if (typeof value === 'string') {
      (newConfig.appearance as any)[key] = value;
    }
    
    setWidgetConfig(newConfig);
  };

  const handleBehaviorChange = (key: keyof NonNullable<ShareSettings['behavior']>, value: any) => {
    if (!widgetConfig) return;
    
    const newConfig = { ...widgetConfig };
    if (!newConfig.behavior) newConfig.behavior = {};
    
    if (key === 'auto_open_delay' && typeof value === 'string') {
      newConfig.behavior.auto_open_delay = parseInt(value, 10);
    } else if ((key === 'auto_open' || key === 'persist_conversation' || key === 'save_conversation_id') && typeof value === 'boolean') {
      (newConfig.behavior as any)[key] = value;
    }
    
    setWidgetConfig(newConfig);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Widget para tu sitio web</h3>
                <p className="text-sm text-muted-foreground">
                  Configura y obtén el código para incrustar el chatbot en tu sitio web
                </p>
              </div>
              
              <div className="flex gap-2">
                <ChatbotPreviewDialog
                  chatbotId={chatbotId || ''}
                  widgetConfig={widgetConfig}
                />
              </div>
            </div>
            
            {isLoading ? (
              <div className="h-[100px] flex items-center justify-center">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <>
                <Tabs 
                  defaultValue="embed" 
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full mt-4"
                >
                  <TabsList className="grid grid-cols-5 mb-4">
                    <TabsTrigger value="embed">Código</TabsTrigger>
                    <TabsTrigger value="appearance">Apariencia</TabsTrigger>
                    <TabsTrigger value="content">Contenido</TabsTrigger>
                    <TabsTrigger value="colors">Colores</TabsTrigger>
                    <TabsTrigger value="restrictions">Restricciones</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="embed">
                    <div className="mt-4 relative">
                      <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                        <code>
                          {`<script src="https://obiiomoqhpbgaymfphdz.supabase.co/storage/v1/object/public/widget/widget.js" data-widget-id="${widgetId}"></script>`}
                        </code>
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-3 right-3"
                        onClick={copyEmbedCode}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Vista previa</h4>
                      <div className="border rounded-md p-4 bg-muted/50">
                        <div className="flex justify-center">
                          <ChatbotPreviewDialog 
                            chatbotId={chatbotId || ''}
                            widgetConfig={widgetConfig}
                          >
                            <Button variant="outline" size="lg" className="gap-2">
                              <Eye className="h-4 w-4" /> Ver cómo se verá tu chatbot
                            </Button>
                          </ChatbotPreviewDialog>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="appearance">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="position">Posición</Label>
                          <Select 
                            value={widgetConfig?.appearance?.position || 'right'} 
                            onValueChange={(value) => handleAppearanceChange('position', value)}
                          >
                            <SelectTrigger id="position">
                              <SelectValue placeholder="Selecciona una posición" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">Izquierda</SelectItem>
                              <SelectItem value="right">Derecha</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="initial_state">Estado inicial</Label>
                          <Select 
                            value={widgetConfig?.appearance?.initial_state || 'closed'} 
                            onValueChange={(value) => handleAppearanceChange('initial_state', value)}
                          >
                            <SelectTrigger id="initial_state">
                              <SelectValue placeholder="Selecciona un estado inicial" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="closed">Cerrado</SelectItem>
                              <SelectItem value="open">Abierto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="width">Ancho (px)</Label>
                          <Input 
                            id="width" 
                            type="number" 
                            value={widgetConfig?.appearance?.width || 350} 
                            onChange={(e) => handleAppearanceChange('width', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="height">Alto (px)</Label>
                          <Input 
                            id="height" 
                            type="number" 
                            value={widgetConfig?.appearance?.height || 500} 
                            onChange={(e) => handleAppearanceChange('height', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="border_radius">Radio de borde (px)</Label>
                          <Input 
                            id="border_radius" 
                            type="number" 
                            value={widgetConfig?.appearance?.border_radius || 10} 
                            onChange={(e) => handleAppearanceChange('border_radius', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="offset_x">Margen horizontal (px)</Label>
                          <Input 
                            id="offset_x" 
                            type="number" 
                            value={widgetConfig?.appearance?.offset_x || 20} 
                            onChange={(e) => handleAppearanceChange('offset_x', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="offset_y">Margen vertical (px)</Label>
                          <Input 
                            id="offset_y" 
                            type="number" 
                            value={widgetConfig?.appearance?.offset_y || 20} 
                            onChange={(e) => handleAppearanceChange('offset_y', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="box_shadow" className="block mb-2">Sombra</Label>
                          <div className="flex items-center">
                            <Switch 
                              id="box_shadow" 
                              checked={widgetConfig?.appearance?.box_shadow || false}
                              onCheckedChange={(checked) => handleAppearanceChange('box_shadow', checked)}
                            />
                            <Label htmlFor="box_shadow" className="ml-2">
                              {widgetConfig?.appearance?.box_shadow ? "Activado" : "Desactivado"}
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="content">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Título</Label>
                          <Input 
                            id="title" 
                            value={widgetConfig?.content?.title || ''} 
                            onChange={(e) => handleContentChange('title', e.target.value)}
                            placeholder="Chat con nosotros"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="subtitle">Subtítulo</Label>
                          <Input 
                            id="subtitle" 
                            value={widgetConfig?.content?.subtitle || ''} 
                            onChange={(e) => handleContentChange('subtitle', e.target.value)}
                            placeholder="Responderemos tus dudas"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="placeholder_text">Texto del placeholder</Label>
                          <Input 
                            id="placeholder_text" 
                            value={widgetConfig?.content?.placeholder_text || ''} 
                            onChange={(e) => handleContentChange('placeholder_text', e.target.value)}
                            placeholder="Escribe un mensaje..."
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="welcome_message">Mensaje de bienvenida</Label>
                          <Input 
                            id="welcome_message" 
                            value={widgetConfig?.content?.welcome_message || ''} 
                            onChange={(e) => handleContentChange('welcome_message', e.target.value)}
                            placeholder="¡Hola! ¿En qué puedo ayudarte hoy?"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="branding" className="block mb-2">Mostrar "Powered by Lovable"</Label>
                          <div className="flex items-center">
                            <Switch 
                              id="branding" 
                              checked={widgetConfig?.content?.branding || false}
                              onCheckedChange={(checked) => handleContentChange('branding', checked)}
                            />
                            <Label htmlFor="branding" className="ml-2">
                              {widgetConfig?.content?.branding ? "Activado" : "Desactivado"}
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="colors">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="primary">Color primario</Label>
                          <div className="flex">
                            <Input 
                              id="primary" 
                              type="color" 
                              className="w-12 p-1 h-10"
                              value={widgetConfig?.colors?.primary || '#2563eb'} 
                              onChange={(e) => handleColorChange('primary', e.target.value)}
                            />
                            <Input 
                              className="ml-2 flex-1"
                              value={widgetConfig?.colors?.primary || '#2563eb'} 
                              onChange={(e) => handleColorChange('primary', e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="background">Color de fondo</Label>
                          <div className="flex">
                            <Input 
                              id="background" 
                              type="color" 
                              className="w-12 p-1 h-10"
                              value={widgetConfig?.colors?.background || '#ffffff'} 
                              onChange={(e) => handleColorChange('background', e.target.value)}
                            />
                            <Input 
                              className="ml-2 flex-1"
                              value={widgetConfig?.colors?.background || '#ffffff'} 
                              onChange={(e) => handleColorChange('background', e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="text">Color de texto</Label>
                          <div className="flex">
                            <Input 
                              id="text" 
                              type="color" 
                              className="w-12 p-1 h-10"
                              value={widgetConfig?.colors?.text || '#333333'} 
                              onChange={(e) => handleColorChange('text', e.target.value)}
                            />
                            <Input 
                              className="ml-2 flex-1"
                              value={widgetConfig?.colors?.text || '#333333'} 
                              onChange={(e) => handleColorChange('text', e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="user_bubble">Burbuja del usuario</Label>
                          <div className="flex">
                            <Input 
                              id="user_bubble" 
                              type="color" 
                              className="w-12 p-1 h-10"
                              value={widgetConfig?.colors?.user_bubble || '#2563eb'} 
                              onChange={(e) => handleColorChange('user_bubble', e.target.value)}
                            />
                            <Input 
                              className="ml-2 flex-1"
                              value={widgetConfig?.colors?.user_bubble || '#2563eb'} 
                              onChange={(e) => handleColorChange('user_bubble', e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="bot_bubble">Burbuja del chatbot</Label>
                          <div className="flex">
                            <Input 
                              id="bot_bubble" 
                              type="color" 
                              className="w-12 p-1 h-10"
                              value={widgetConfig?.colors?.bot_bubble || '#f1f0f0'} 
                              onChange={(e) => handleColorChange('bot_bubble', e.target.value)}
                            />
                            <Input 
                              className="ml-2 flex-1"
                              value={widgetConfig?.colors?.bot_bubble || '#f1f0f0'} 
                              onChange={(e) => handleColorChange('bot_bubble', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="restrictions">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="allowed_domains" className="block mb-2">Dominios permitidos</Label>
                        <p className="text-sm text-muted-foreground mb-4">
                          Si no especificas ningún dominio, el widget funcionará en cualquier sitio web.
                          Agrega dominios para restringir dónde se puede usar el widget.
                        </p>
                        
                        <div className="flex gap-2 mb-4">
                          <Input 
                            id="allowed_domains" 
                            placeholder="ejemplo.com"
                            value={allowedDomain}
                            onChange={(e) => setAllowedDomain(e.target.value)}
                          />
                          <Button onClick={addAllowedDomain}>Agregar</Button>
                        </div>
                        
                        {widgetConfig?.restrictions?.allowed_domains?.length ? (
                          <div className="space-y-2">
                            {widgetConfig.restrictions.allowed_domains.map((domain, index) => (
                              <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                                <span>{domain}</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0" 
                                  onClick={() => removeDomain(domain)}
                                >
                                  &times;
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-md text-center">
                            No hay dominios restringidos
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex justify-end mt-6">
                  <Button 
                    disabled={isSaving} 
                    onClick={updateSettings}
                    className="gap-2"
                  >
                    {isSaving && <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>}
                    Guardar configuración
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShareSettings;
