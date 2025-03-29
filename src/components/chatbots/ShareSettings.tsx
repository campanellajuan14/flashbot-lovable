import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Copy, RefreshCw, Save, Settings, AlertTriangle, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { Json } from "@/integrations/supabase/types";

interface ShareSettings {
  enabled: boolean;
  widget_id?: string;
  appearance: {
    theme: 'light' | 'dark' | 'system';
    position: 'right' | 'left';
    offset_x: number;
    offset_y: number;
    initial_state: 'open' | 'closed' | 'minimized';
    width: number | string;
    height: number | string;
    border_radius: number;
    box_shadow: boolean;
    z_index: number;
  };
  content: {
    title: string;
    subtitle?: string;
    initial_message: string;
    placeholder_text: string;
    welcome_message?: string;
    branding: boolean;
  };
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
    user_bubble: string;
    bot_bubble: string;
    links: string;
  };
  behavior: {
    auto_open: boolean;
    auto_open_delay: number;
    persist_conversation: boolean;
    save_conversation_id: boolean;
  };
  restrictions: {
    allowed_domains: string[];
    require_user_identity: boolean;
    max_messages_per_session: number | null;
  };
}

const defaultShareSettings: ShareSettings = {
  enabled: false,
  appearance: {
    theme: 'light',
    position: 'right',
    offset_x: 20,
    offset_y: 20,
    initial_state: 'closed',
    width: 350,
    height: 500,
    border_radius: 10,
    box_shadow: true,
    z_index: 9999
  },
  content: {
    title: 'Asistente Virtual',
    subtitle: 'Respuestas en tiempo real',
    initial_message: '¡Hola! ¿En qué puedo ayudarte hoy?',
    placeholder_text: 'Escribe tu pregunta...',
    welcome_message: 'Bienvenido a nuestro asistente virtual. Estoy aquí para responder tus dudas.',
    branding: true
  },
  colors: {
    primary: '#4a6cf7',
    secondary: '#6c757d',
    text: '#333333',
    background: '#ffffff',
    user_bubble: '#4a6cf7',
    bot_bubble: '#f1f0f0',
    links: '#0078ff'
  },
  behavior: {
    auto_open: false,
    auto_open_delay: 5,
    persist_conversation: true,
    save_conversation_id: true
  },
  restrictions: {
    allowed_domains: [],
    require_user_identity: false,
    max_messages_per_session: null
  }
};

const ShareSettings = () => {
  const { id: chatbotId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<ShareSettings>(defaultShareSettings);
  const [domainsText, setDomainsText] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [embedType, setEmbedType] = useState<'script' | 'iframe'>('script');

  const generateWidgetId = () => {
    return 'wgt_' + Math.random().toString(36).substring(2, 15);
  };

  const { data: chatbot, isLoading } = useQuery({
    queryKey: ["chatbot-share-settings", chatbotId],
    queryFn: async () => {
      if (!chatbotId) throw new Error("Chatbot ID is required");
      
      const { data, error } = await supabase
        .from("chatbots")
        .select("id, name, share_settings")
        .eq("id", chatbotId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!chatbotId
  });

  useEffect(() => {
    if (chatbot && chatbot.share_settings) {
      const loadedSettings = chatbot.share_settings as unknown as ShareSettings;
      
      setSettings(prevSettings => ({
        ...prevSettings,
        ...loadedSettings,
      }));

      if (loadedSettings.restrictions?.allowed_domains) {
        setDomainsText(loadedSettings.restrictions.allowed_domains.join("\n"));
      }
    }
  }, [chatbot]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: ShareSettings) => {
      if (!chatbotId) throw new Error("Chatbot ID is required");
      
      if (newSettings.enabled && !newSettings.widget_id) {
        newSettings.widget_id = generateWidgetId();
      }
      
      const { error } = await supabase
        .from("chatbots")
        .update({ share_settings: newSettings as unknown as Json })
        .eq("id", chatbotId);
      
      if (error) throw error;
      return newSettings;
    },
    onSuccess: (savedSettings) => {
      toast({
        title: "Configuración guardada",
        description: "La configuración de compartir se ha actualizado correctamente.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["chatbot-share-settings", chatbotId] });
      setSettings(savedSettings);
    },
    onError: (error) => {
      console.error("Error saving share settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la configuración. Por favor, intenta de nuevo.",
      });
    }
  });

  const handleSaveSettings = () => {
    const updatedSettings = { ...settings };
    updatedSettings.restrictions.allowed_domains = domainsText
      .split("\n")
      .map(domain => domain.trim())
      .filter(domain => domain.length > 0);
    
    saveSettingsMutation.mutate(updatedSettings);
  };

  const handleCopyCode = () => {
    const baseUrl = window.location.origin;
    let code = '';
    
    if (embedType === 'script') {
      code = `<script>
  (function(w, d, s, o, f, js, fjs) {
    w['ChatbotWidget'] = o;
    w[o] = w[o] || function() { (w[o].q = w[o].q || []).push(arguments) };
    js = d.createElement(s), fjs = d.getElementsByTagName(s)[0];
    js.id = o; js.src = f; js.async = 1; fjs.parentNode.insertBefore(js, fjs);
  }(window, document, 'script', 'lovableChatbot', '${baseUrl}/widget.js'));
  
  lovableChatbot('init', { widget_id: '${settings.widget_id}' });
</script>`;
    } else {
      code = `<iframe 
  src="${baseUrl}/widget/${settings.widget_id}" 
  width="${settings.appearance.width}" 
  height="${settings.appearance.height}" 
  frameborder="0"
  style="position: fixed; bottom: ${settings.appearance.offset_y}px; ${settings.appearance.position}: ${settings.appearance.offset_x}px; border: none; z-index: ${settings.appearance.z_index};">
</iframe>`;
    }
    
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
    
    toast({
      title: "Código copiado",
      description: "El código de integración ha sido copiado al portapapeles.",
    });
  };

  const handleGenerateNewWidgetId = () => {
    setSettings(prev => ({
      ...prev,
      widget_id: generateWidgetId()
    }));
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Cargando configuración...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" /> 
            Configuración de Compartir
          </CardTitle>
          <CardDescription>
            Configura cómo tu chatbot puede ser compartido en otros sitios web
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableShare">Habilitar compartir</Label>
                <p className="text-sm text-muted-foreground">
                  Permite que tu chatbot sea integrado en sitios web externos
                </p>
              </div>
              <Switch
                id="enableShare"
                checked={settings.enabled}
                onCheckedChange={(checked) => 
                  setSettings({...settings, enabled: checked})
                }
              />
            </div>
            
            {settings.enabled && (
              <>
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>ID de Widget</Label>
                      <p className="text-sm text-muted-foreground">
                        Identificador único para este widget
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateNewWidgetId}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerar
                    </Button>
                  </div>
                  
                  <Input
                    value={settings.widget_id || generateWidgetId()}
                    readOnly
                    className="font-mono"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {settings.enabled && (
        <>
          <Tabs defaultValue="appearance">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="appearance">Apariencia</TabsTrigger>
              <TabsTrigger value="content">Contenido</TabsTrigger>
              <TabsTrigger value="colors">Colores</TabsTrigger>
              <TabsTrigger value="behavior">Comportamiento</TabsTrigger>
            </TabsList>
            
            <TabsContent value="appearance" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Apariencia del Widget</CardTitle>
                  <CardDescription>
                    Configura cómo se verá el chatbot en la página
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="theme">Tema</Label>
                      <Select
                        value={settings.appearance.theme}
                        onValueChange={(value) => 
                          setSettings({
                            ...settings, 
                            appearance: {
                              ...settings.appearance,
                              theme: value as 'light' | 'dark' | 'system'
                            }
                          })
                        }
                      >
                        <SelectTrigger id="theme">
                          <SelectValue placeholder="Seleccionar tema" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Claro</SelectItem>
                          <SelectItem value="dark">Oscuro</SelectItem>
                          <SelectItem value="system">Sistema</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="position">Posición</Label>
                      <Select
                        value={settings.appearance.position}
                        onValueChange={(value) => 
                          setSettings({
                            ...settings, 
                            appearance: {
                              ...settings.appearance,
                              position: value as 'right' | 'left'
                            }
                          })
                        }
                      >
                        <SelectTrigger id="position">
                          <SelectValue placeholder="Seleccionar posición" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="right">Derecha</SelectItem>
                          <SelectItem value="left">Izquierda</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="offsetX">Margen Horizontal ({settings.appearance.offset_x}px)</Label>
                      <Slider
                        id="offsetX"
                        value={[settings.appearance.offset_x]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(value) => 
                          setSettings({
                            ...settings, 
                            appearance: {
                              ...settings.appearance,
                              offset_x: value[0]
                            }
                          })
                        }
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="offsetY">Margen Vertical ({settings.appearance.offset_y}px)</Label>
                      <Slider
                        id="offsetY"
                        value={[settings.appearance.offset_y]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(value) => 
                          setSettings({
                            ...settings, 
                            appearance: {
                              ...settings.appearance,
                              offset_y: value[0]
                            }
                          })
                        }
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="initialState">Estado Inicial</Label>
                      <Select
                        value={settings.appearance.initial_state}
                        onValueChange={(value) => 
                          setSettings({
                            ...settings, 
                            appearance: {
                              ...settings.appearance,
                              initial_state: value as 'open' | 'closed' | 'minimized'
                            }
                          })
                        }
                      >
                        <SelectTrigger id="initialState">
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Abierto</SelectItem>
                          <SelectItem value="closed">Cerrado</SelectItem>
                          <SelectItem value="minimized">Minimizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="borderRadius">Radio de Bordes ({settings.appearance.border_radius}px)</Label>
                      <Slider
                        id="borderRadius"
                        value={[settings.appearance.border_radius]}
                        min={0}
                        max={20}
                        step={1}
                        onValueChange={(value) => 
                          setSettings({
                            ...settings, 
                            appearance: {
                              ...settings.appearance,
                              border_radius: value[0]
                            }
                          })
                        }
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="width">Ancho</Label>
                      <Input
                        id="width"
                        type="number"
                        value={typeof settings.appearance.width === 'number' 
                          ? settings.appearance.width 
                          : parseInt(settings.appearance.width as string)}
                        onChange={(e) => 
                          setSettings({
                            ...settings, 
                            appearance: {
                              ...settings.appearance,
                              width: parseInt(e.target.value)
                            }
                          })
                        }
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="height">Alto</Label>
                      <Input
                        id="height"
                        type="number"
                        value={typeof settings.appearance.height === 'number' 
                          ? settings.appearance.height 
                          : parseInt(settings.appearance.height as string)}
                        onChange={(e) => 
                          setSettings({
                            ...settings, 
                            appearance: {
                              ...settings.appearance,
                              height: parseInt(e.target.value)
                            }
                          })
                        }
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="boxShadow"
                          checked={settings.appearance.box_shadow}
                          onCheckedChange={(checked) => 
                            setSettings({
                              ...settings, 
                              appearance: {
                                ...settings.appearance,
                                box_shadow: checked
                              }
                            })
                          }
                        />
                        <Label htmlFor="boxShadow">Sombra</Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Añadir sombra al widget para destacarlo
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="zIndex">Z-Index</Label>
                      <Input
                        id="zIndex"
                        type="number"
                        value={settings.appearance.z_index}
                        onChange={(e) => 
                          setSettings({
                            ...settings, 
                            appearance: {
                              ...settings.appearance,
                              z_index: parseInt(e.target.value)
                            }
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Ajusta la capa de visualización del widget
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="content" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contenido del Widget</CardTitle>
                  <CardDescription>
                    Personaliza los textos y el contenido del chatbot
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={settings.content.title}
                      onChange={(e) => 
                        setSettings({
                          ...settings, 
                          content: {
                            ...settings.content,
                            title: e.target.value
                          }
                        })
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtítulo</Label>
                    <Input
                      id="subtitle"
                      value={settings.content.subtitle || ''}
                      onChange={(e) => 
                        setSettings({
                          ...settings, 
                          content: {
                            ...settings.content,
                            subtitle: e.target.value
                          }
                        })
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="welcomeMessage">Mensaje de Bienvenida</Label>
                    <Textarea
                      id="welcomeMessage"
                      rows={3}
                      value={settings.content.welcome_message || ''}
                      onChange={(e) => 
                        setSettings({
                          ...settings, 
                          content: {
                            ...settings.content,
                            welcome_message: e.target.value
                          }
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Este mensaje se mostrará automáticamente cuando el usuario abra el chatbot
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="placeholderText">Texto del Placeholder</Label>
                    <Input
                      id="placeholderText"
                      value={settings.content.placeholder_text}
                      onChange={(e) => 
                        setSettings({
                          ...settings, 
                          content: {
                            ...settings.content,
                            placeholder_text: e.target.value
                          }
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="branding"
                      checked={settings.content.branding}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings, 
                          content: {
                            ...settings.content,
                            branding: checked
                          }
                        })
                      }
                    />
                    <div>
                      <Label htmlFor="branding">Mostrar "Powered by Lovable"</Label>
                      <p className="text-xs text-muted-foreground">
                        Añade una pequeña etiqueta de marca al chatbot
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="colors" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Colores del Widget</CardTitle>
                  <CardDescription>
                    Personaliza los colores para que coincidan con tu marca
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Color Primario</Label>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="h-6 w-6 rounded-full border"
                          style={{ backgroundColor: settings.colors.primary }}
                        />
                        <Input
                          id="primaryColor"
                          type="color"
                          value={settings.colors.primary}
                          onChange={(e) => 
                            setSettings({
                              ...settings, 
                              colors: {
                                ...settings.colors,
                                primary: e.target.value
                              }
                            })
                          }
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor">Color Secundario</Label>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="h-6 w-6 rounded-full border"
                          style={{ backgroundColor: settings.colors.secondary }}
                        />
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={settings.colors.secondary}
                          onChange={(e) => 
                            setSettings({
                              ...settings, 
                              colors: {
                                ...settings.colors,
                                secondary: e.target.value
                              }
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="backgroundColor">Color de Fondo</Label>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="h-6 w-6 rounded-full border"
                          style={{ backgroundColor: settings.colors.background }}
                        />
                        <Input
                          id="backgroundColor"
                          type="color"
                          value={settings.colors.background}
                          onChange={(e) => 
                            setSettings({
                              ...settings, 
                              colors: {
                                ...settings.colors,
                                background: e.target.value
                              }
                            })
                          }
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="textColor">Color de Texto</Label>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="h-6 w-6 rounded-full border"
                          style={{ backgroundColor: settings.colors.text }}
                        />
                        <Input
                          id="textColor"
                          type="color"
                          value={settings.colors.text}
                          onChange={(e) => 
                            setSettings({
                              ...settings, 
                              colors: {
                                ...settings.colors,
                                text: e.target.value
                              }
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="userBubbleColor">Color de Burbuja Usuario</Label>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="h-6 w-6 rounded-full border"
                          style={{ backgroundColor: settings.colors.user_bubble }}
                        />
                        <Input
                          id="userBubbleColor"
                          type="color"
                          value={settings.colors.user_bubble}
                          onChange={(e) => 
                            setSettings({
                              ...settings, 
                              colors: {
                                ...settings.colors,
                                user_bubble: e.target.value
                              }
                            })
                          }
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="botBubbleColor">Color de Burbuja Bot</Label>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="h-6 w-6 rounded-full border"
                          style={{ backgroundColor: settings.colors.bot_bubble }}
                        />
                        <Input
                          id="botBubbleColor"
                          type="color"
                          value={settings.colors.bot_bubble}
                          onChange={(e) => 
                            setSettings({
                              ...settings, 
                              colors: {
                                ...settings.colors,
                                bot_bubble: e.target.value
                              }
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="linksColor">Color de Enlaces</Label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="h-6 w-6 rounded-full border"
                        style={{ backgroundColor: settings.colors.links }}
                      />
                      <Input
                        id="linksColor"
                        type="color"
                        value={settings.colors.links}
                        onChange={(e) => 
                          setSettings({
                            ...settings, 
                            colors: {
                              ...settings.colors,
                              links: e.target.value
                            }
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="behavior" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Comportamiento del Widget</CardTitle>
                  <CardDescription>
                    Configura cómo se comporta el chatbot con los usuarios
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="autoOpen">Abrir Automáticamente</Label>
                        <p className="text-sm text-muted-foreground">
                          El chatbot se abrirá automáticamente después de un tiempo
                        </p>
                      </div>
                      <Switch
                        id="autoOpen"
                        checked={settings.behavior.auto_open}
                        onCheckedChange={(checked) => 
                          setSettings({
                            ...settings, 
                            behavior: {
                              ...settings.behavior,
                              auto_open: checked
                            }
                          })
                        }
                      />
                    </div>
                    
                    {settings.behavior.auto_open && (
                      <div className="space-y-2">
                        <Label htmlFor="autoOpenDelay">
                          Tiempo de Espera ({settings.behavior.auto_open_delay} segundos)
                        </Label>
                        <Slider
                          id="autoOpenDelay"
                          value={[settings.behavior.auto_open_delay]}
                          min={1}
                          max={60}
                          step={1}
                          onValueChange={(value) => 
                            setSettings({
                              ...settings, 
                              behavior: {
                                ...settings.behavior,
                                auto_open_delay: value[0]
                              }
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="persistConversation">Persistir Conversación</Label>
                      <p className="text-sm text-muted-foreground">
                        Guarda la conversación en el navegador del usuario
                      </p>
                    </div>
                    <Switch
                      id="persistConversation"
                      checked={settings.behavior.persist_conversation}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings, 
                          behavior: {
                            ...settings.behavior,
                            persist_conversation: checked
                          }
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="saveConversationId">Guardar ID de Conversación</Label>
                      <p className="text-sm text-muted-foreground">
                        Mantiene el mismo hilo de conversación entre sesiones
                      </p>
                    </div>
                    <Switch
                      id="saveConversationId"
                      checked={settings.behavior.save_conversation_id}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings, 
                          behavior: {
                            ...settings.behavior,
                            save_conversation_id: checked
                          }
                        })
                      }
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label>Restricciones de Dominio</Label>
                    <Textarea
                      placeholder="ejemplo.com&#10;blog.ejemplo.com"
                      value={domainsText}
                      onChange={(e) => setDomainsText(e.target.value)}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Restringe el uso del widget a dominios específicos (uno por línea). Deja en blanco para permitir cualquier dominio.
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="requireUserIdentity">Requerir Identidad de Usuario</Label>
                      <p className="text-sm text-muted-foreground">
                        El widget solicitará información del usuario
                      </p>
                    </div>
                    <Switch
                      id="requireUserIdentity"
                      checked={settings.restrictions.require_user_identity}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings, 
                          restrictions: {
                            ...settings.restrictions,
                            require_user_identity: checked
                          }
                        })
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxMessages">Mensajes Máximos por Sesión</Label>
                    <Input
                      id="maxMessages"
                      type="number"
                      placeholder="Sin límite"
                      value={settings.restrictions.max_messages_per_session || ''}
                      onChange={(e) => 
                        setSettings({
                          ...settings, 
                          restrictions: {
                            ...settings.restrictions,
                            max_messages_per_session: e.target.value ? parseInt(e.target.value) : null
                          }
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Limita el número de mensajes por sesión (deja en blanco para sin límite)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <Card>
            <CardHeader>
              <CardTitle>Código de Integración</CardTitle>
              <CardDescription>
                Copia este código y pégalo en tu sitio web para integrar el chatbot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-x-2">
                  <Button
                    variant={embedType === 'script' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEmbedType('script')}
                  >
                    JavaScript
                  </Button>
                  <Button
                    variant={embedType === 'iframe' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEmbedType('iframe')}
                  >
                    iFrame
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  className={cn(isCopied && "bg-green-50")}
                >
                  <Copy className={cn("h-4 w-4 mr-2", isCopied && "text-green-500")} />
                  {isCopied ? "¡Copiado!" : "Copiar Código"}
                </Button>
              </div>
              
              <div className="relative">
                <div className="p-4 bg-muted rounded-md font-mono text-xs overflow-x-auto">
                  {embedType === 'script' ? (
                    <pre>{`<script>
  (function(w, d, s, o, f, js, fjs) {
    w['ChatbotWidget'] = o;
    w[o] = w[o] || function() { (w[o].q = w[o].q || []).push(arguments) };
    js = d.createElement(s), fjs = d.getElementsByTagName(s)[0];
    js.id = o; js.src = f; js.async = 1; fjs.parentNode.insertBefore(js, fjs);
  }(window, document, 'script', 'lovableChatbot', '${window.location.origin}/widget.js'));
  
  lovableChatbot('init', { widget_id: '${settings.widget_id || 'WIDGET_ID'}' });
</script>`}</pre>
                  ) : (
                    <pre>{`<iframe 
  src="${window.location.origin}/widget/${settings.widget_id || 'WIDGET_ID'}" 
  width="${settings.appearance.width}" 
  height="${settings.appearance.height}" 
  frameborder="0"
  style="position: fixed; bottom: ${settings.appearance.offset_y}px; ${settings.appearance.position}: ${settings.appearance.offset_x}px; border: none; z-index: ${settings.appearance.z_index};">
</iframe>`}</pre>
                  )}
                </div>
              </div>
              
              {!settings.widget_id && (
                <div className="flex items-center space-x-2 text-amber-500">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-sm">
                    Guarda la configuración para generar un ID de widget
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
      
      <div className="flex justify-between">
        {settings.enabled && (
          <Button variant="outline" onClick={() => console.log("Preview not implemented yet")}>
            <Sparkles className="h-4 w-4 mr-2" />
            Vista Previa
          </Button>
        )}
        
        <Button 
          onClick={handleSaveSettings}
          disabled={saveSettingsMutation.isPending}
        >
          {saveSettingsMutation.isPending ? (
            <>Guardando...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Configuración
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ShareSettings;
