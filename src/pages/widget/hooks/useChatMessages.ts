
import { useState } from "react";

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iaWlvbW9xaHBiZ2F5bWZwaGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjIyNTUsImV4cCI6MjA1MzMzODI1NX0.JAtEJ3nJucemX7rQd1I0zlTBGAVsNQ_SPGiULmjwfXY';

interface Message {
  role: string;
  content: string;
}

interface WidgetConfig {
  id: string;
  config: {
    behavior?: {
      persist_conversation?: boolean;
    };
  };
}

export const useChatMessages = (
  widgetId: string | undefined,
  config: WidgetConfig | null,
  messages: Message[],
  setMessages: (messages: Message[]) => void,
  conversationId: string | null,
  setConversationId: (id: string | null) => void
) => {
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || !config || sending || !widgetId) return;
    
    const userMessage = inputValue.trim();
    setInputValue("");
    
    // Add user message to state immediately
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setSending(true);
    
    try {
      // Log the start of the API call
      console.log("[useChatMessages] Sending message with conversation ID:", conversationId);
      
      if (typeof window !== 'undefined' && window.widgetDiagnostics) {
        window.widgetDiagnostics.addEvent('SEND_MESSAGE', 'Sending message to API', {
          conversationId: conversationId || 'new',
          messageLength: userMessage.length
        });
      }
      
      const startTime = Date.now();
      const response = await fetch('https://obiiomoqhpbgaymfphdz.supabase.co/functions/v1/claude-chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
          'x-client-info': 'widget-embed-component',
          'Origin': window.location.origin,
          'x-diagnostic-info': `widgetId=${widgetId};ts=${Date.now()}`
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
            referrer: document.referrer,
            timestamp: new Date().toISOString()
          }
        })
      });
      
      const apiTime = Date.now() - startTime;
      console.log(`[useChatMessages] API response received in ${apiTime}ms with status: ${response.status}`);
      
      if (typeof window !== 'undefined' && window.widgetDiagnostics) {
        window.widgetDiagnostics.addEvent('API_RESPONSE', 'Received API response', {
          status: response.status,
          time: apiTime
        });
      }
      
      if (!response.ok) {
        console.error(`[useChatMessages] Error sending message: ${response.status} ${response.statusText}`);
        
        // Try to get the error message
        let errorMessage = "Error sending message";
        try {
          const errorData = await response.json();
          console.error('[useChatMessages] Error details:', errorData);
          
          if (typeof window !== 'undefined' && window.widgetDiagnostics) {
            window.widgetDiagnostics.addEvent('API_ERROR', 'Error from API (JSON)', errorData);
          }
          
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          try {
            const errorText = await response.text();
            console.error(`[useChatMessages] Error response text: ${errorText}`);
            
            if (typeof window !== 'undefined' && window.widgetDiagnostics) {
              window.widgetDiagnostics.addEvent('API_ERROR', 'Error from API (Text)', { text: errorText });
            }
          } catch (textError) {
            console.error('[useChatMessages] Could not parse error response', textError);
            
            if (typeof window !== 'undefined' && window.widgetDiagnostics) {
              window.widgetDiagnostics.addEvent('API_ERROR', 'Could not parse error response', { 
                error: String(textError) 
              });
            }
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log("[useChatMessages] API response:", result);
      
      if (typeof window !== 'undefined' && window.widgetDiagnostics) {
        window.widgetDiagnostics.addEvent('MESSAGE_RECEIVED', 'Received bot message', {
          conversationId: result.conversation_id || conversationId,
          messageLength: result.message?.length || 0
        });
      }
      
      // Save conversation ID if first response
      if (result.conversation_id && !conversationId) {
        console.log("[useChatMessages] Setting new conversation ID:", result.conversation_id);
        setConversationId(result.conversation_id);
      }
      
      // Add bot response to state
      const updatedMessages = [...newMessages, { role: "assistant", content: result.message }];
      setMessages(updatedMessages);
      
      // Save conversation if needed
      if (config.config.behavior?.persist_conversation && widgetId) {
        console.log("[useChatMessages] Saving conversation to localStorage");
        localStorage.setItem(`flashbot_chat_${widgetId}`, JSON.stringify({
          messages: updatedMessages,
          conversationId: result.conversation_id || conversationId
        }));
        
        if (typeof window !== 'undefined' && window.widgetDiagnostics) {
          window.widgetDiagnostics.addEvent('STORAGE', 'Saved conversation to localStorage', {
            messageCount: updatedMessages.length
          });
        }
      }
      
    } catch (error: any) {
      console.error("[useChatMessages] Error sending message:", error);
      
      if (typeof window !== 'undefined' && window.widgetDiagnostics) {
        window.widgetDiagnostics.addEvent('ERROR', 'Error sending message', {
          error: error.message || String(error)
        });
      }
      
      // Add error message to the chat
      setMessages([...newMessages, { 
        role: "assistant", 
        content: "Sorry, there was an error processing your message. Please try again later." 
      }]);
      
    } finally {
      setSending(false);
    }
  };

  return {
    inputValue,
    setInputValue,
    sending,
    handleInputChange,
    handleSendMessage
  };
};

// Augment the Window interface 
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
