
import { ShareSettings } from "./types";

/**
 * Creates a default widget configuration
 */
export const createDefaultWidgetConfig = (widgetId: string): ShareSettings => {
  return {
    widget_id: widgetId,
    enabled: true,
    appearance: {
      position: 'right',
      theme: 'light',
      initial_state: 'closed',
      offset_x: 20,
      offset_y: 20,
      width: 350,
      height: 500,
      border_radius: 8,
      box_shadow: true,
      z_index: 9999
    },
    content: {
      title: 'Chat with us',
      subtitle: 'Ask us anything',
      welcome_message: 'Hello! How can I help you today?',
      placeholder_text: 'Type your message here...',
      branding: true
    },
    colors: {
      primary: '#2563eb',
      secondary: '#f1f5f9',
      background: '#ffffff',
      text: '#333333',
      user_bubble: '#2563eb',
      bot_bubble: '#f1f5f9',
      links: '#2563eb'
    },
    behavior: {
      auto_open: false,
      auto_open_delay: 3,
      persist_conversation: true,
      save_conversation_id: false
    },
    restrictions: {
      allowed_domains: []
    }
  };
};

/**
 * Copies the widget embed code to the clipboard
 */
export const copyEmbedCode = (widgetId: string | null): boolean => {
  if (!widgetId) return false;
  
  const embedCode = `<script src="https://obiiomoqhpbgaymfphdz.supabase.co/storage/v1/object/public/widget/widget.js" data-widget-id="${widgetId}"></script>`;
  
  try {
    navigator.clipboard.writeText(embedCode);
    return true;
  } catch (error) {
    console.error('Failed to copy embed code:', error);
    return false;
  }
};

/**
 * Creates a widget iframe embed code
 */
export const getIframeEmbedCode = (widgetId: string | null): string => {
  if (!widgetId) return '';
  return `<iframe src="https://chatbot-platform.lovable.app/widget/${widgetId}" width="100%" height="600" frameborder="0"></iframe>`;
};
