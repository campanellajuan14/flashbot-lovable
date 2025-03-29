
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface WidgetConfig {
  id: string;
  name: string;
  config: {
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
  };
}

const WidgetEmbed = () => {
  const { widgetId } = useParams<{ widgetId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [inputValue, setInputValue] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadWidgetConfig = async () => {
      if (!widgetId) {
        setError("Widget ID no encontrado");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `https://obiiomoqhpbgaymfphdz.supabase.co/functions/v1/widget-config?widget_id=${widgetId}`
        );

        if (!response.ok) {
          throw new Error("No se pudo cargar la configuración del widget");
        }

        const data = await response.json();
        setConfig(data);

        // Check if we have a saved conversation
        if (data.config.behavior.persist_conversation) {
          const savedConversation = localStorage.getItem(`lovable_chat_${widgetId}`);
          if (savedConversation) {
            try {
              const { messages: savedMessages, conversationId: savedId } = JSON.parse(savedConversation);
              if (savedMessages) setMessages(savedMessages);
              if (savedId) setConversationId(savedId);
            } catch (e) {
              console.error("Error parsing saved conversation:", e);
            }
          }
        }

        // Show welcome message if no messages and welcome message exists
        if (data.config.content.welcome_message && messages.length === 0) {
          setMessages([
            { role: "assistant", content: data.config.content.welcome_message }
          ]);
        }

      } catch (error) {
        console.error("Error loading widget config:", error);
        setError("Error al cargar la configuración del widget");
      } finally {
        setLoading(false);
      }
    };

    loadWidgetConfig();
  }, [widgetId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || !config) return;
    
    const userMessage = inputValue.trim();
    setInputValue("");
    
    // Add user message to state
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setSending(true);
    
    try {
      // Send message to API
      const response = await fetch('https://obiiomoqhpbgaymfphdz.supabase.co/functions/v1/claude-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          chatbotId: config.id,
          conversationId: conversationId,
          source: 'widget',
          widget_id: widgetId
        })
      });
      
      if (!response.ok) throw new Error('Error al enviar mensaje');
      
      const result = await response.json();
      
      // Save conversation ID if first response
      if (result.conversation_id && !conversationId) {
        setConversationId(result.conversation_id);
      }
      
      // Add bot response to state
      setMessages(prev => [...prev, { role: "assistant", content: result.answer }]);
      
      // Save conversation if needed
      if (config.config.behavior.persist_conversation) {
        localStorage.setItem(`lovable_chat_${widgetId}`, JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }, { role: "assistant", content: result.answer }],
          conversationId: result.conversation_id || conversationId
        }));
      }
      
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Add error message
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo más tarde." 
      }]);
      
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background text-muted-foreground p-4 text-center">
        <h3 className="text-lg font-medium">Error</h3>
        <p>{error || "No se pudo cargar el widget"}</p>
      </div>
    );
  }

  const { appearance, content, colors } = config.config;

  return (
    <div className="h-screen flex flex-col" style={{ 
      backgroundColor: colors.background,
      color: colors.text,
      borderRadius: `${appearance.border_radius}px`,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div className="p-4" style={{ backgroundColor: colors.primary, color: '#ffffff' }}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">{content.title}</h3>
            {content.subtitle && <p className="text-sm opacity-90">{content.subtitle}</p>}
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div 
        className="flex-1 p-4 overflow-y-auto"
        style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              style={{
                backgroundColor: msg.role === 'user' ? colors.user_bubble : colors.bot_bubble,
                color: msg.role === 'user' ? '#ffffff' : colors.text,
                padding: '8px 12px',
                borderRadius: msg.role === 'user' ? '18px 18px 0 18px' : '18px 18px 18px 0',
                maxWidth: '80%',
                overflowWrap: 'break-word'
              }}
              dangerouslySetInnerHTML={{
                __html: msg.content.replace(
                  /(https?:\/\/[^\s]+)/g, 
                  `<a href="$1" target="_blank" style="color: ${colors.links || '#0078ff'};">$1</a>`
                ).replace(/\n/g, '<br>')
              }}
            />
          </div>
        ))}
        
        {sending && (
          <div className="flex justify-start">
            <div 
              style={{
                backgroundColor: colors.bot_bubble,
                color: colors.text,
                padding: '8px 12px',
                borderRadius: '18px 18px 18px 0',
                display: 'inline-block'
              }}
            >
              <span className="text-muted">Escribiendo...</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Input */}
      <div className="p-3 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={content.placeholder_text}
            className="flex-1 p-2 border rounded"
            style={{ 
              borderColor: 'rgba(0,0,0,0.2)',
              borderRadius: '4px',
              color: colors.text
            }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || sending}
            style={{
              backgroundColor: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '0 12px',
              cursor: inputValue.trim() && !sending ? 'pointer' : 'default',
              opacity: inputValue.trim() && !sending ? 1 : 0.7
            }}
          >
            Enviar
          </button>
        </form>
      </div>
      
      {/* Branding */}
      {content.branding && (
        <div 
          className="p-2 text-center text-xs" 
          style={{ borderTop: '1px solid rgba(0,0,0,0.1)', color: '#999' }}
        >
          <a 
            href="https://lovable.dev" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#999', textDecoration: 'none' }}
          >
            Powered by Lovable
          </a>
        </div>
      )}
    </div>
  );
};

export default WidgetEmbed;
