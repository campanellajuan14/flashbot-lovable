
import { Json } from "@/integrations/supabase/types";

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
    hideBackground?: boolean;
    minimalIframe?: boolean; // Nuevo campo para mostrar solo los mensajes en iframe
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
