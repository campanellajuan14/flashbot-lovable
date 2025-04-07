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

export interface WidgetErrorInfo {
  error: string;
  details?: string;
  allowedDomains?: string[];
}

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iaWlvbW9xaHBiZ2F5bWZwaGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjIyNTUsImV4cCI6MjA1MzMzODI1NX0.JAtEJ3nJucemX7rQd1I0zlTBGAVsNQ_SPGiULmjwfXY';

// Define a global diagnostic object for widget issues
declare global {
  interface Window {
    widgetDiagnostics?: {
      startTime: string;
      events: Array<{
        timestamp: string;
        type: string;
        message: string;
        data: any;
      }>;
      addEvent: (type: string, message: string, data?: any) => void;
    };
  }
}

// Create a diagnostic object in the window for potential widget issues
if (typeof window !== 'undefined') {
  window.widgetDiagnostics = window.widgetDiagnostics || {
    startTime: new Date().toISOString(),
    events: [],
    addEvent: function(type, message, data) {
      this.events.push({
        timestamp: new Date().toISOString(),
        type,
        message,
        data: data || null
      });
      console.log(`[Widget-Diagnostics] [${type}]`, message, data || '');
    }
  };
}

export const useWidgetConfig = (widgetId: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState<WidgetErrorInfo | null>(null);
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds
    const controller = new AbortController();
    const signal = controller.signal;

    const addDiagnosticEvent = (type: string, message: string, data?: any) => {
      if (typeof window !== 'undefined' && window.widgetDiagnostics) {
        window.widgetDiagnostics.addEvent(type, message, data);
      }
    };

    const loadWidgetConfig = async () => {
      if (!widgetId) {
        console.error("[useWidgetConfig] No widget ID provided");
        addDiagnosticEvent('ERROR', 'No widget ID provided', null);
        setErrorInfo({
          error: "ID del widget no proporcionado",
          details: "Se requiere un ID de widget válido para cargar la configuración"
        });
        setLoading(false);
        return;
      }

      try {
        console.log(`[useWidgetConfig] Attempt ${retryCount + 1}: Loading configuration for widget ID: ${widgetId}`);
        addDiagnosticEvent('FETCH', `Attempt ${retryCount + 1}: Loading widget configuration`, { widgetId });
        
        // Add debug parameter to help with troubleshooting
        const isDebugMode = window.location.search.includes('debug=true');
        const apiUrl = `https://obiiomoqhpbgaymfphdz.supabase.co/functions/v1/widget-config?widget_id=${widgetId}${isDebugMode ? '&debug=true' : ''}`;
        console.log(`[useWidgetConfig] Full URL: ${apiUrl}`);
        addDiagnosticEvent('URL', 'API endpoint', { url: apiUrl });

        // Include more diagnostic headers to help troubleshoot
        const headers = {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
          'x-client-info': 'widget-embed-component',
          'Origin': window.location.origin,
          'Referer': document.referrer || window.location.href,
          'x-diagnostic-info': `widgetId=${widgetId};attempt=${retryCount+1};ts=${Date.now()};host=${window.location.hostname}`
        };

        console.log("[useWidgetConfig] Request headers:", {
          'Content-Type': headers['Content-Type'],
          'apikey': headers['apikey'] ? 'Present (not showing full key)' : 'Missing',
          'Authorization': headers['Authorization'] ? 'Bearer token present' : 'Missing bearer token',
          'x-client-info': headers['x-client-info'],
          'Origin': headers['Origin'],
          'Referer': headers['Referer'],
          'x-diagnostic-info': headers['x-diagnostic-info']
        });
        
        addDiagnosticEvent('HEADERS', 'Request headers', {
          'apikey': headers['apikey'] ? 'Present' : 'Missing',
          'Authorization': headers['Authorization'] ? 'Present' : 'Missing',
          'Origin': headers['Origin'],
          'Referer': headers['Referer'],
          'diagnostic': headers['x-diagnostic-info']
        });

        const startTime = Date.now();
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers,
          signal,
          cache: 'no-cache' // Bypass cache for fresh results
        });
        
        const responseTime = Date.now() - startTime;
        console.log(`[useWidgetConfig] Response received in ${responseTime}ms with status: ${response.status} ${response.statusText}`);
        addDiagnosticEvent('RESPONSE', `Received response with status ${response.status}`, { 
          status: response.status, 
          statusText: response.statusText,
          timeMs: responseTime
        });
        
        if (!response.ok) {
          console.error(`[useWidgetConfig] Error loading widget: ${response.status} ${response.statusText}`);
          addDiagnosticEvent('ERROR', `Error response: ${response.status}`, { status: response.status });
          
          let errorMessage = `Error loading widget configuration (${response.status})`;
          let errorDetails = null;
          let allowedDomains = undefined;
          
          try {
            const errorData = await response.json();
            console.error('[useWidgetConfig] Error details:', errorData);
            addDiagnosticEvent('ERROR', 'Error details from response', errorData);
            
            if (errorData && errorData.error) {
              errorMessage = errorData.error;
            }
            if (errorData && errorData.details) {
              errorDetails = errorData.details;
              console.error('[useWidgetConfig] Additional error details:', errorData.details);
              addDiagnosticEvent('ERROR', 'Additional error details', errorData.details);
            }
            if (errorData && errorData.allowedDomains) {
              allowedDomains = errorData.allowedDomains;
              console.error('[useWidgetConfig] Allowed domains:', errorData.allowedDomains);
              addDiagnosticEvent('ERROR', 'Allowed domains', errorData.allowedDomains);
            }
          } catch (e) {
            try {
            const errorText = await response.text();
              console.error(`[useWidgetConfig] Response content: ${errorText}`);
              addDiagnosticEvent('ERROR', 'Error response text', { text: errorText });
              errorDetails = errorText;
            } catch (textError) {
              console.error('[useWidgetConfig] Could not parse response', textError);
              addDiagnosticEvent('ERROR', 'Could not parse response', { error: String(textError) });
          }
          }
          
          // If still retries left, try again
          if (retryCount < maxRetries) {
            console.log(`[useWidgetConfig] Retry ${retryCount + 1}/${maxRetries} in ${retryDelay}ms`);
            addDiagnosticEvent('RETRY', `Scheduling retry ${retryCount + 1}/${maxRetries}`, {
              delay: retryDelay,
              nextAttemptIn: new Date(Date.now() + retryDelay).toISOString()
            });
            
            setRetryCount(retryCount + 1);
            setTimeout(loadWidgetConfig, retryDelay);
            return;
          }
          
          // Set final error state after exhausting retries
          setErrorInfo({
            error: errorMessage,
            details: errorDetails || undefined,
            allowedDomains: allowedDomains
          });
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log("[useWidgetConfig] Widget configuration loaded:", data);
        addDiagnosticEvent('SUCCESS', 'Widget configuration loaded', { 
          id: data.id,
          name: data.name
        });
        
        // Construct the final config, preferring loaded data but providing fallbacks
        const finalConfig: WidgetConfig = {
          id: data.id || widgetId || 'unknown-id',
          name: data.name || 'Chatbot',
          config: {
            // Merge appearance, ensuring it's an object
            appearance: { 
              ...(data.config?.appearance || {}) 
            },
            // Merge content: Prioritize loaded data completely
            content: {
              // Use loaded content object if it exists, otherwise provide minimal defaults
              ...(data.config?.content || { 
                  title: 'Chat', 
                  placeholder_text: 'Type your message...', 
                  branding: true 
              }),
              // FORZAR mensaje de bienvenida personalizado ignorando la base de datos
              welcome_message: "Hey there! 👋 I'm Flashy, your super-charged AI guide to Flashbot!",
            },
            // Merge colors, ensuring it's an object
            colors: {
              ...(data.config?.colors || {})
            },
            // Merge behavior, ensuring it's an object
            behavior: {
              ...(data.config?.behavior || {})
            }
          }
        };
        
        // Add a specific check and warning if the welcome message ended up undefined/null
        if (finalConfig.config.content.welcome_message === undefined || finalConfig.config.content.welcome_message === null) {
            console.warn("[useWidgetConfig] Welcome message is explicitly missing or null in the final config.", { loadedContent: data.config?.content });
            addDiagnosticEvent('WARNING', 'Final welcome message is missing/null', { loadedContent: data.config?.content });
        }

        // --- DEBUG LOG --- 
        console.log("[useWidgetConfig] Final welcome message before setConfig:", finalConfig.config.content.welcome_message);
        console.log("[useWidgetConfig] Final config object before setConfig:", JSON.stringify(finalConfig)); // Log the whole object
        // --- END DEBUG LOG ---

        // Set the correctly constructed final configuration
        setConfig(finalConfig);

        // Check if we have a saved conversation
        if (finalConfig.config.behavior.persist_conversation) {
          const savedConversation = localStorage.getItem(`flashbot_chat_${widgetId}`);
          console.log(`[useWidgetConfig] Checking for saved conversation:`, savedConversation ? "Found" : "Not found");
          addDiagnosticEvent('STORAGE', 'Checking for saved conversation', { found: !!savedConversation });
          
          if (savedConversation) {
            try {
              const { messages: savedMessages, conversationId: savedId } = JSON.parse(savedConversation);
              console.log(`[useWidgetConfig] Parsed saved conversation:`, { 
                messageCount: savedMessages?.length || 0, 
                conversationId: savedId || "None"
              });
              addDiagnosticEvent('STORAGE', 'Parsed saved conversation', { 
                messageCount: savedMessages?.length || 0,
                hasConversationId: !!savedId
              });
              
              if (savedMessages) setMessages(savedMessages);
              if (savedId) setConversationId(savedId);
            } catch (e) {
              console.error("[useWidgetConfig] Error processing saved conversation:", e);
              addDiagnosticEvent('ERROR', 'Error processing saved conversation', { error: String(e) });
            }
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('[useWidgetConfig] Uncaught error:', error);
        addDiagnosticEvent('ERROR', 'Uncaught error in config loading', { error: String(error) });
        
        // If we still have retries, try again
        if (retryCount < maxRetries) {
          console.log(`[useWidgetConfig] Retry ${retryCount + 1}/${maxRetries} after error`);
          setRetryCount(retryCount + 1);
          setTimeout(loadWidgetConfig, retryDelay);
          return;
        }
        
        setErrorInfo({
          error: `Error cargando la configuración del widget: ${error instanceof Error ? error.message : String(error)}`,
          details: "Por favor verifica tu conexión a internet e inténtalo de nuevo."
        });
        setLoading(false);
      }
    };

    loadWidgetConfig();

    return () => {
      controller.abort();
    };
  }, [widgetId, retryCount, setConversationId, setMessages]);

  return { loading, errorInfo, config, messages, conversationId, setMessages, setConversationId };
};

