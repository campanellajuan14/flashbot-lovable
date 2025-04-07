import { useState, useCallback } from "react";
import { sendChatMessage } from "../../../lib/api";

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

interface ChatMessagesProps {
  widgetId?: string;
  chatbotId: string;
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
  messages: Array<Message>;
  setMessages: (messages: Array<Message>) => void;
}

export const useChatMessages = ({
  widgetId,
  chatbotId,
  conversationId,
  setConversationId,
  messages,
  setMessages
}: ChatMessagesProps) => {
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);

  // Memoize handleInputChange to prevent unnecessary re-renders if passed down
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || sending || !chatbotId) {
        console.warn("[useChatMessages] Send message prevented:", { 
            hasInput: !!trimmedInput, 
            isSending: sending, 
            hasChatbotId: !!chatbotId 
        });
        return;
    }

    // Store current input value before clearing it
    const messageToSend = inputValue;
    
    // Add user message to the UI immediately
    const userMessage: Message = { role: "user", content: messageToSend };
    // Create a stable reference for the messages *before* sending
    const currentMessages = [...messages, userMessage]; 
    setMessages(currentMessages);
    setInputValue(""); // Clear input immediately
    setSending(true);

    console.log('[useChatMessages] Preparing to send message:', {
        widgetId,
        chatbotId,
        conversationId,
        messageLength: messageToSend.length,
        source: 'widget_embed'
    });
    
    try {
      const response = await sendChatMessage({
        message: messageToSend,
        chatbotId,
        conversationId,
        source: 'widget_embed',
        widgetId
      });
      
      // Response received, create assistant message
      const assistantMessage: Message = { role: "assistant", content: response.message };
      const newMessages = [...currentMessages, assistantMessage]; // Append to the stable reference
      setMessages(newMessages);

      // Update conversation ID if it's new
      const newConversationId = response.conversation_id;
      if (newConversationId && newConversationId !== conversationId) {
        setConversationId(newConversationId);
        
        // Save to localStorage if available and persistence is enabled (optional check)
        if (typeof window !== 'undefined') {
          try {
            // Note: We might want to check config.behavior.persist_conversation here
            localStorage.setItem(`flashbot_chat_${widgetId}`, JSON.stringify({
              messages: newMessages,
              conversationId: newConversationId
            }));
          } catch (e) {
            console.error('[useChatMessages] Error saving to localStorage:', e);
          }
        }
      } else {
           // Save updated messages to localStorage even if conversationId didn't change
           if (typeof window !== 'undefined' && conversationId) {
               try {
                   localStorage.setItem(`flashbot_chat_${widgetId}`, JSON.stringify({
                       messages: newMessages,
                       conversationId: conversationId 
                   }));
               } catch (e) {
                    console.error('[useChatMessages] Error updating localStorage:', e);
               }
           }
      }

    } catch (error) {
      console.error('[useChatMessages] Error sending message:', error);
      
      // Restore input field with the message that failed to send? Optional.
      // setInputValue(messageToSend); 

      // Add error message to the chat interface instead of crashing
      const errorMessage: Message = { 
        role: "assistant", 
        content: `Lo siento, ocurrió un error al enviar tu mensaje. Detalles: ${error instanceof Error ? error.message : String(error)}`
      };
      // Use the stable `currentMessages` to avoid race conditions if user sends multiple messages quickly
      setMessages([...currentMessages, errorMessage]); 

    } finally {
      // Always ensure sending state is turned off
      setSending(false);
    }
  };

  return {
    inputValue,
    setInputValue, // Expose setter for direct control if needed (like in WidgetEmbed)
    sending,
    handleInputChange,
    handleSendMessage
  };
};
