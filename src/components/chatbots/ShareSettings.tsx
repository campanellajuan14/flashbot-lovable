
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import ChatbotPreviewDialog from "@/components/chatbots/ChatbotPreviewDialog";
import { Button } from "@/components/ui/button";
import { Copy, Eye } from "lucide-react";
import { Json } from "@/integrations/supabase/types";

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

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Widget para tu sitio web</h3>
                <p className="text-sm text-muted-foreground">
                  Usa este código para incrustar el chatbot en tu sitio web
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
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShareSettings;
