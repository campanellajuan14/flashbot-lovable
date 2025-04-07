import React, { useState, useEffect, useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import WidgetContainer from "./components/WidgetContainer";
import WidgetError from "./components/WidgetError";
import WidgetLoading from "./components/WidgetLoading";
import { useChatMessages } from "./hooks/useChatMessages";
import { useWidgetConfig } from "./hooks/useWidgetConfig";
import MessagesOnlyView from "./components/MessagesOnlyView";

const WidgetEmbed: React.FC = () => {
  // Get widget ID from URL params and path directly
  const params = useParams<{ widgetId?: string }>();
  const location = useLocation();
  
  // Extract widget ID from various possible sources
  const widgetId = useMemo(() => {
    // First check params (most reliable)
    if (params.widgetId) {
      return params.widgetId;
    }
    
    // If params don't have it, try to extract from pathname
    const pathParts = location.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    
    // Check if the last path part looks like a UUID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(lastPart)) {
      return lastPart;
    }
    
    // Try search params as last resort
    const searchParams = new URLSearchParams(location.search);
    const widgetIdFromSearch = searchParams.get('widget_id') || searchParams.get('widgetId');
    if (widgetIdFromSearch) {
      return widgetIdFromSearch;
    }
    
    return undefined;
  }, [params, location]);
  
  // Always declare state variables at the top level
  const [inputValue, setInputValue] = useState("");
  
  // Log all attempts to obtain widget ID
  useEffect(() => {
    console.log("[WidgetEmbed] Debugging widget ID resolution:");
    console.log("  - URL pathname:", location.pathname);
    console.log("  - URL params:", params);
    console.log("  - Path parts:", location.pathname.split('/'));
    console.log("  - Query params:", location.search);
    console.log("  - Resolved widget ID:", widgetId);
  }, [location, params, widgetId]);
  
  // Get configuration for the widget
  const { loading, errorInfo, config, messages, conversationId, setMessages, setConversationId } = useWidgetConfig(widgetId);
  
  // Log the widget embed initialization
  useEffect(() => {
    console.log("[WidgetEmbed] Initializing widget embed with ID:", widgetId);
    console.log("[WidgetEmbed] Loading state:", loading);
    console.log("[WidgetEmbed] Error state:", errorInfo);
  }, [widgetId, loading, errorInfo]);
  
  // Call useChatMessages unconditionally at the top level
  // This is crucial for React's hook rules
  const {
    sending: chatSending,
    handleSendMessage: chatHandleSendMessage,
    handleInputChange: chatHandleInputChange
  } = useChatMessages({
    widgetId,
    // Provide fallback values when config is not available
    chatbotId: config?.id || "",
    conversationId,
    setConversationId,
    messages: messages || [],
    setMessages: setMessages || (() => {})
  });

  // Handle all user input interactions consistently
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (config) {
      chatHandleInputChange(e);
    }
  };
  
  // Create safe handler functions
  const handleSendMessage = () => {
    if (config) {
      chatHandleSendMessage();
    }
  };
  
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
          sending={chatSending}
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
          sending={chatSending}
          handleInputChange={handleInputChange}
          handleSendMessage={handleSendMessage}
        />
      )}
    </div>
  );
};

export default WidgetEmbed;
