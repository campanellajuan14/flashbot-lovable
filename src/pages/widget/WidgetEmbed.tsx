import React, { useState } from "react";
import { useParams } from "react-router-dom";
import WidgetContainer from "./components/WidgetContainer";
import WidgetError from "./components/WidgetError";
import WidgetLoading from "./components/WidgetLoading";
import { useChatMessages } from "./hooks/useChatMessages";
import { useWidgetConfig } from "./hooks/useWidgetConfig";
import MessagesOnlyView from "./components/MessagesOnlyView";

const WidgetEmbed: React.FC = () => {
  const { widgetId } = useParams<{ widgetId: string }>();
  const { loading, errorInfo, config, messages, conversationId, setMessages, setConversationId } = useWidgetConfig(widgetId);
  const [inputValue, setInputValue] = useState("");
  
  // Log the widget embed initialization
  console.log("[WidgetEmbed] Initializing widget embed with ID:", widgetId);
  console.log("[WidgetEmbed] Loading state:", loading);
  console.log("[WidgetEmbed] Error state:", errorInfo);
  
  // Handle widget loading
  if (loading) {
    return <WidgetLoading />;
  }
  
  // Handle widget errors
  if (errorInfo) {
    return <WidgetError 
      error={errorInfo.error} 
      details={errorInfo.details} 
      allowedDomains={errorInfo.allowedDomains}
    />;
  }
  
  // Handle missing widget configuration
  if (!config) {
    return <WidgetError 
      error="Error de configuración" 
      details="No se pudo cargar la configuración del widget correctamente."
    />;
  }
  
  const { sending, handleSendMessage } = useChatMessages({
    widgetId,
    chatbotId: config.id,
    conversationId,
    setConversationId,
    messages,
    setMessages
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  
  console.log("[WidgetEmbed] Rendering widget with config:", { 
    appearance: config.config.appearance,
    hideBackground: config.config.appearance?.hideBackground || false
  });

  const { appearance, content, colors } = config.config;
  const hideBackground = appearance?.hideBackground || false;

  return (
    <div className="h-full flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
      {hideBackground ? (
        <MessagesOnlyView
          messages={messages}
          sending={sending}
          welcomeMessage={content?.welcome_message}
          userBubbleColor={colors?.user_bubble}
          botBubbleColor={colors?.bot_bubble}
          textColor={colors?.text}
        />
      ) : (
        <WidgetContainer
          config={config.config}
          messages={messages}
          inputValue={inputValue}
          sending={sending}
          handleInputChange={handleInputChange}
          handleSendMessage={handleSendMessage}
        />
      )}
    </div>
  );
};

export default WidgetEmbed;
