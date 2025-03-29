
import { ShareSettings } from "./types";
import { Json } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export const createDefaultWidgetConfig = (widgetId: string): ShareSettings => {
  return {
    widget_id: widgetId,
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
};

export const saveWidgetSettings = async (chatbotId: string, widgetConfig: ShareSettings) => {
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
    
    return true;
  } catch (error) {
    console.error("Error updating settings:", error);
    toast({
      title: "Error",
      description: "No se pudo guardar la configuración",
      variant: "destructive",
    });
    return false;
  }
};

export const copyEmbedCode = (widgetId: string | null) => {
  if (!widgetId) return false;
  
  const embedCode = `<script src="https://obiiomoqhpbgaymfphdz.supabase.co/storage/v1/object/public/widget/widget.js" data-widget-id="${widgetId}"></script>`;
  
  try {
    navigator.clipboard.writeText(embedCode);
    toast({
      title: "Código copiado",
      description: "El código de incrustación se ha copiado al portapapeles",
    });
    return true;
  } catch (error) {
    console.error("Error copying embed code:", error);
    toast({
      title: "Error",
      description: "No se pudo copiar el código. Inténtalo de nuevo.",
      variant: "destructive",
    });
    return false;
  }
};
