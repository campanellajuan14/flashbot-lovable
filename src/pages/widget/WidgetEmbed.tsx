
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Loader2, AlertCircle, Zap, ExternalLink } from "lucide-react";

// Definimos una versión reducida de la configuración del widget
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

const WidgetEmbed: React.FC = () => {
  const { widgetId } = useParams<{ widgetId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [inputValue, setInputValue] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // API key for the widget
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iaWlvbW9xaHBiZ2F5bWZwaGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjIyNTUsImV4cCI6MjA1MzMzODI1NX0.JAtEJ3nJucemX7rQd1I0zlTBGAVsNQ_SPGiULmjwfXY';

  // Auto scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const loadWidgetConfig = async () => {
      if (!widgetId) {
        setError("ID del widget no encontrado");
        setLoading(false);
        return;
      }

      try {
        console.log(`Intentando cargar configuración para widget ID: ${widgetId}`);
        const apiUrl = `https://obiiomoqhpbgaymfphdz.supabase.co/functions/v1/widget-config?widget_id=${widgetId}`;
        console.log(`URL completo: ${apiUrl}`);

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
        
        console.log(`Respuesta recibida con estado: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          console.error(`Error cargando widget: ${response.status} ${response.statusText}`);
          let errorMessage = `Error al cargar la configuración del widget`;
          
          try {
            const errorData = await response.json();
            if (errorData && errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (e) {
            const errorText = await response.text();
            console.error(`Contenido de la respuesta: ${errorText}`);
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("Configuración del widget cargada:", data);
        
        // Asegurémonos de que la configuración tiene valores por defecto para evitar errores
        const defaultConfig: WidgetConfig = {
          id: data.id || widgetId,
          name: data.name || "Chat",
          config: {
            appearance: data.config?.appearance || {},
            content: data.config?.content || {
              title: "Chat",
              placeholder_text: "Escribe tu mensaje...",
              welcome_message: "¡Hola! ¿En qué puedo ayudarte hoy?"
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
              if (savedMessages && Array.isArray(savedMessages)) {
                setMessages(savedMessages);
              }
              if (savedId) setConversationId(savedId);
            } catch (e) {
              console.error("Error procesando la conversación guardada:", e);
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
        console.error("Error cargando la configuración del widget:", error);
        setError(error.message || "Error al cargar la configuración del widget");
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
    
    if (!inputValue.trim() || !config || sending) return;
    
    const userMessage = inputValue.trim();
    setInputValue("");
    
    // Add user message to state
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setSending(true);
    
    try {
      // Send message to API
      console.log("Sending message with conversation ID:", conversationId);
      
      const response = await fetch('https://obiiomoqhpbgaymfphdz.supabase.co/functions/v1/claude-chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
          'x-client-info': 'widget-embed-component',
          'Origin': window.location.origin
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: userMessage }],
          chatbotId: config.id,
          conversationId: conversationId,
          source: 'widget',
          widget_id: widgetId,
          user_info: {
            url: window.location.href,
            userAgent: navigator.userAgent,
            referrer: document.referrer
          }
        })
      });
      
      if (!response.ok) {
        console.error(`Error enviando mensaje: ${response.status} ${response.statusText}`);
        
        // Try to get the error message
        let errorMessage = "Error al enviar mensaje";
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          const errorText = await response.text();
          console.error(`Contenido de la respuesta de error: ${errorText}`);
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log("Respuesta del servidor:", result);
      
      // Save conversation ID if first response
      if (result.conversation_id && !conversationId) {
        setConversationId(result.conversation_id);
      }
      
      // Add bot response to state
      setMessages(prev => [...prev, { role: "assistant", content: result.message }]);
      
      // Save conversation if needed
      if (config.config.behavior.persist_conversation) {
        localStorage.setItem(`flashbot_chat_${widgetId}`, JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }, { role: "assistant", content: result.message }],
          conversationId: result.conversation_id || conversationId
        }));
      }
      
    } catch (error: any) {
      console.error("Error enviando mensaje:", error);
      
      // Add error message
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, inténtalo de nuevo más tarde." 
      }]);
      
    } finally {
      setSending(false);
      scrollToBottom();
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
      <div className="h-screen flex flex-col items-center justify-center bg-background text-muted-foreground p-4 text-center gap-3">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h3 className="text-lg font-medium">Error</h3>
        <p>{error || "Error al cargar la configuración del widget :("}</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Este widget puede no estar habilitado o podría requerir permisos de acceso de dominio.
        </p>
      </div>
    );
  }

  const { appearance, content, colors } = config.config;
  
  const DEFAULT_COLORS = {
    text: "#333333",
    background: "#ffffff",
    primary: "#2563eb",
    bot_bubble: "#f1f5f9",
    user_bubble: "#2563eb",
    links: "#0078ff"
  };

  return (
    <div className="h-screen flex flex-col" style={{ 
      backgroundColor: colors.background || DEFAULT_COLORS.background,
      color: colors.text || DEFAULT_COLORS.text,
      borderRadius: `${appearance.border_radius || 0}px`,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div className="p-4" style={{ backgroundColor: colors.primary || DEFAULT_COLORS.primary, color: '#ffffff' }}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">{content.title || 'Chat'}</h3>
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
                backgroundColor: msg.role === 'user' ? 
                  (colors.user_bubble || DEFAULT_COLORS.user_bubble) : 
                  (colors.bot_bubble || DEFAULT_COLORS.bot_bubble),
                color: msg.role === 'user' ? '#ffffff' : (colors.text || DEFAULT_COLORS.text),
                padding: '8px 12px',
                borderRadius: msg.role === 'user' ? '18px 18px 0 18px' : '18px 18px 18px 0',
                maxWidth: '80%',
                overflowWrap: 'break-word'
              }}
              dangerouslySetInnerHTML={{
                __html: msg.content.replace(
                  /(https?:\/\/[^\s]+)/g, 
                  `<a href="$1" target="_blank" style="color: ${colors.links || DEFAULT_COLORS.links};">$1</a>`
                ).replace(/\n/g, '<br>')
              }}
            />
          </div>
        ))}
        
        {sending && (
          <div className="flex justify-start">
            <div 
              style={{
                backgroundColor: colors.bot_bubble || DEFAULT_COLORS.bot_bubble,
                color: colors.text || DEFAULT_COLORS.text,
                padding: '8px 12px',
                borderRadius: '18px 18px 18px 0',
                display: 'inline-block'
              }}
            >
              <span className="text-muted">Escribiendo...</span>
            </div>
          </div>
        )}
        
        {/* Invisible div to scroll to */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-3 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={content.placeholder_text || "Escribe un mensaje..."}
            className="flex-1 p-2 border rounded"
            style={{ 
              borderColor: 'rgba(0,0,0,0.2)',
              borderRadius: '4px',
              color: colors.text || DEFAULT_COLORS.text
            }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || sending}
            style={{
              backgroundColor: colors.primary || DEFAULT_COLORS.primary,
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
      {(content.branding !== false) && (
        <div 
          className="p-2 text-center text-xs" 
          style={{ borderTop: '1px solid rgba(0,0,0,0.1)', color: '#999' }}
        >
          <a 
            href="https://flashbot.lovable.app" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#999', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
          >
            <Zap className="h-3 w-3" />
            Powered by Flashbot
          </a>
        </div>
      )}
    </div>
  );
};

export default WidgetEmbed;
