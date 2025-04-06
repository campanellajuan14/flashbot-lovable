
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import WidgetLoading from "./components/WidgetLoading";
import WidgetError from "./components/WidgetError";
import WidgetContainer from "./components/WidgetContainer";
import MessagesOnlyView from "./components/MessagesOnlyView";
import { useWidgetConfig } from "./hooks/useWidgetConfig";
import { useChatMessages } from "./hooks/useChatMessages";

const WidgetEmbed: React.FC = () => {
  const { widgetId } = useParams<{ widgetId: string }>();
  
  console.log("[WidgetEmbed] Initializing with widget ID:", widgetId);
  
  // Add more detailed page load timing information
  useEffect(() => {
    const startTime = new Date().getTime();
    console.log("[WidgetEmbed] Page loaded at:", new Date().toISOString());
    console.log("[WidgetEmbed] URL:", window.location.href);
    console.log("[WidgetEmbed] Referrer:", document.referrer || "None");
    
    return () => {
      const loadTime = new Date().getTime() - startTime;
      console.log("[WidgetEmbed] Component unmounted after", loadTime, "ms");
    };
  }, []);
  
  const { 
    loading, 
    error, 
    config, 
    messages, 
    setMessages,
    conversationId,
    setConversationId
  } = useWidgetConfig(widgetId);

  console.log("[WidgetEmbed] Config loaded status:", { 
    loading, 
    error: error ? error : "No error", 
    configExists: !!config,
    messagesCount: messages?.length || 0,
    conversationId: conversationId || "None"
  });

  const {
    inputValue,
    sending,
    handleInputChange,
    handleSendMessage
  } = useChatMessages(
    widgetId, 
    config, 
    messages, 
    setMessages, 
    conversationId, 
    setConversationId
  );

  if (loading) {
    console.log("[WidgetEmbed] Still loading widget config");
    return <WidgetLoading />;
  }

  if (error || !config) {
    console.error("[WidgetEmbed] Error or missing config:", error);
    return <WidgetError error={error} />;
  }

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
