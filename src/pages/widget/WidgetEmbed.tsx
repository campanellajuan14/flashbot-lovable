import React, { useEffect, useState } from "react";
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
  const widgetId = params.widgetId || (() => {
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
  })();
  
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
  const {
    loading,
    errorInfo,
    config,
    messages,
    conversationId,
    setMessages,
    setConversationId
  } = useWidgetConfig(widgetId);

  // Call useChatMessages unconditionally at the top level
  const {
    inputValue,
    sending,
    handleInputChange,
    handleSendMessage,
    // Need setInputValue from useChatMessages to manage input state
    setInputValue: setChatInputValue 
  } = useChatMessages({
    widgetId,
    // Provide fallback values until config is loaded
    chatbotId: config?.id ?? "", 
    conversationId,
    setConversationId,
    messages: messages ?? [],
    setMessages: setMessages ?? (() => {})
  });

  // Manage the input value locally in WidgetEmbed too,
  // synchronizing with the one in useChatMessages
  const [localInputValue, setLocalInputValue] = useState("");

  useEffect(() => {
    // Sync local input with the input from the hook
    setLocalInputValue(inputValue);
  }, [inputValue]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalInputValue(e.target.value);
    // Also update the input value within useChatMessages
    setChatInputValue(e.target.value); 
  };
  
  // Log the widget embed initialization
  useEffect(() => {
    console.log("[WidgetEmbed] Initializing widget embed with ID:", widgetId);
    console.log("[WidgetEmbed] Loading state:", loading);
    console.log("[WidgetEmbed] Error state:", errorInfo);
  }, [widgetId, loading, errorInfo]);

  // Add welcome message logic, depends on config being loaded
  useEffect(() => {
    if (
      config &&
      messages &&
      messages.length === 0 &&
      config.config.content?.welcome_message &&
      !conversationId && 
      setMessages // Ensure setMessages is available
    ) {
      console.log("[WidgetEmbed] Adding welcome message:", config.config.content.welcome_message);
      // Ensure welcome message is added safely
      try {
        const welcomeMsg = { role: "assistant", content: config.config.content.welcome_message };
        // Check if message structure is valid before setting
        if (typeof welcomeMsg.content === 'string') { 
            setMessages([welcomeMsg]);
        } else {
            console.error("[WidgetEmbed] Invalid welcome message content type:", typeof welcomeMsg.content);
            setMessages([{ role: "assistant", content: "Error: Invalid welcome message format." }]);
        }
      } catch (e) {
        console.error("[WidgetEmbed] Error setting welcome message:", e);
        setMessages([{ role: "assistant", content: "Error displaying welcome message." }]);
      }
    }
  }, [config, messages, conversationId, setMessages]); // Ensure messages is a dependency

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
  
  // Handle missing widget configuration after loading is done
  if (!config) {
    return <WidgetError 
      error="Error de configuración" 
      details="No se pudo cargar la configuración del widget correctamente después de la carga."
    />;
  }
  
  // At this point, config is guaranteed to be available
  console.log("[WidgetEmbed] Rendering widget with config:", { 
    appearance: config.config.appearance,
    hideBackground: config.config.appearance?.hideBackground || false
  });

  // --- RESTORING ORIGINAL CODE --- 
  const { appearance, content, colors } = config.config;
  const hideBackground = appearance?.hideBackground || false;

  return (
    <div className="h-full flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
      {hideBackground ? (
        <MessagesOnlyView
          messages={messages ?? []} 
          sending={sending}
          welcomeMessage={content?.welcome_message}
          userBubbleColor={colors?.user_bubble}
          botBubbleColor={colors?.bot_bubble}
          textColor={colors?.text}
        />
      ) : (
        <WidgetContainer
          config={config.config}
          messages={messages ?? []} 
          inputValue={localInputValue} 
          sending={sending}
          handleInputChange={onInputChange} 
          handleSendMessage={handleSendMessage} 
        />
      )}
    </div>
  );
  // --- END RESTORING ORIGINAL CODE ---
};

export default WidgetEmbed;
