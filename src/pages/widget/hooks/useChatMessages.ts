
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
    
    // Add user message to state
    setMessages([...messages, { role: "user", content: userMessage }]);
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
      const updatedMessages = [...messages, { role: "user", content: userMessage }, { role: "assistant", content: result.message }];
      setMessages(updatedMessages);
      
      // Save conversation if needed
      if (config.config.behavior?.persist_conversation && widgetId) {
        localStorage.setItem(`flashbot_chat_${widgetId}`, JSON.stringify({
          messages: updatedMessages,
          conversationId: result.conversation_id || conversationId
        }));
      }
      
    } catch (error: any) {
      console.error("Error enviando mensaje:", error);
      
      // Add error message
      setMessages([...messages, { role: "user", content: userMessage }, { 
        role: "assistant", 
        content: "Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, inténtalo de nuevo más tarde." 
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
