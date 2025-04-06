
import { useState, useEffect } from "react";

interface WidgetConfig {
  id: string;
  name: string;
  config: {
    appearance: {
      theme?: 'light' | 'dark' | 'system';
      position?: 'right' | 'left';
      offset_x?: number;
      offset_y?: number;
      initial_state?: 'open' | 'closed' | 'minimized';
      width?: number | string;
      height?: number | string;
      border_radius?: number;
      box_shadow?: boolean;
      z_index?: number;
      hideBackground?: boolean;
    };
    content: {
      title?: string;
      subtitle?: string;
      placeholder_text?: string;
      welcome_message?: string;
      branding?: boolean;
    };
    colors: {
      primary?: string;
      secondary?: string;
      text?: string;
      background?: string;
      user_bubble?: string;
      bot_bubble?: string;
      links?: string;
    };
    behavior: {
      auto_open?: boolean;
      auto_open_delay?: number;
      persist_conversation?: boolean;
      save_conversation_id?: boolean;
    };
  };
}

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iaWlvbW9xaHBiZ2F5bWZwaGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjIyNTUsImV4cCI6MjA1MzMzODI1NX0.JAtEJ3nJucemX7rQd1I0zlTBGAVsNQ_SPGiULmjwfXY';

export const useWidgetConfig = (widgetId: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    const loadWidgetConfig = async () => {
      if (!widgetId) {
        setError("Widget ID not found");
        setLoading(false);
        return;
      }

      try {
        console.log(`Attempting to load configuration for widget ID: ${widgetId}`);
        const apiUrl = `https://obiiomoqhpbgaymfphdz.supabase.co/functions/v1/widget-config?widget_id=${widgetId}`;
        console.log(`Full URL: ${apiUrl}`);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${ANON_KEY}`,
            'x-client-info': 'widget-embed-component',
            'Origin': window.location.origin
          }
        });
        
        console.log(`Response received with status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          console.error(`Error loading widget: ${response.status} ${response.statusText}`);
          let errorMessage = `Error loading widget configuration`;
          
          try {
            const errorData = await response.json();
            if (errorData && errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (e) {
            const errorText = await response.text();
            console.error(`Response content: ${errorText}`);
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("Widget configuration loaded:", data);
        
        // Default configuration to avoid errors
        const defaultConfig: WidgetConfig = {
          id: data.id || widgetId,
          name: data.name || "Chat",
          config: {
            appearance: data.config?.appearance || {},
            content: data.config?.content || {
              title: "Chat",
              placeholder_text: "Type your message...",
              welcome_message: "Hello! How can I help you today?"
            },
            colors: data.config?.colors || {
              primary: "#2563eb",
              secondary: "#f1f5f9",
              background: "#ffffff",
              text: "#333333",
              user_bubble: "#2563eb",
              bot_bubble: "#f1f5f9",
              links: "#0078ff"
            },
            behavior: data.config?.behavior || {
              persist_conversation: true,
              auto_open: false,
              auto_open_delay: 0,
              save_conversation_id: false
            }
          }
        };
        
        setConfig(defaultConfig);

        // Check if we have a saved conversation
        if (defaultConfig.config.behavior.persist_conversation) {
          const savedConversation = localStorage.getItem(`flashbot_chat_${widgetId}`);
          if (savedConversation) {
            try {
              const { messages: savedMessages, conversationId: savedId } = JSON.parse(savedConversation);
              if (savedMessages) setMessages(savedMessages);
              if (savedId) setConversationId(savedId);
            } catch (e) {
              console.error("Error processing saved conversation:", e);
            }
          }
        }

        // Show welcome message if no messages and welcome message exists
        if (defaultConfig.config.content.welcome_message && (!messages || messages.length === 0)) {
          setMessages([
            { role: "assistant", content: defaultConfig.config.content.welcome_message }
          ]);
        }

      } catch (error: any) {
        console.error("Error loading widget configuration:", error);
        setError(error.message || "Error loading widget configuration");
      } finally {
        setLoading(false);
      }
    };

    loadWidgetConfig();
  }, [widgetId]);

  return { loading, error, config, messages, setMessages, conversationId, setConversationId };
};
