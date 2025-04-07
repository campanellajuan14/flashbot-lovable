import { useState } from "react";
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
  messages: Array<{ role: string; content: string }>;
  setMessages: (messages: Array<{ role: string; content: string }>) => void;
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || sending) return;
    
    try {
      // Add user message to the UI immediately
      const userMessage = { role: "user", content: inputValue };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInputValue("");
      
      // Set loading state
      setSending(true);
      
      // Send message to API
      const response = await sendChatMessage({
        message: inputValue,
        chatbotId,
        conversationId,
        source: 'widget_embed',
        widgetId
      });
      
      // Update conversation ID if needed
      if (response.conversation_id && !conversationId) {
        setConversationId(response.conversation_id);
        
        // Save to localStorage if available
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`flashbot_chat_${widgetId}`, JSON.stringify({
              messages: [...updatedMessages, { role: 'assistant', content: response.message }],
              conversationId: response.conversation_id
            }));
          } catch (e) {
            console.error('[useChatMessages] Error saving to localStorage:', e);
          }
        }
      }
      
      // Add assistant's response
      const newMessages = [
        ...updatedMessages,
        { role: "assistant", content: response.message }
      ];
      
      // Update state
      setMessages(newMessages);
      
      // Save conversation history if available
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`flashbot_chat_${widgetId}`, JSON.stringify({
            messages: newMessages,
            conversationId: response.conversation_id || conversationId
          }));
        } catch (e) {
          console.error('[useChatMessages] Error saving to localStorage:', e);
        }
      }
    } catch (error) {
      console.error('[useChatMessages] Error sending message:', error);
      
      // Add error message
      setMessages([
        ...messages,
        { 
          role: "assistant", 
          content: "Lo siento, no pude enviar el mensaje. Por favor, inténtalo de nuevo."
        }
      ]);
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
