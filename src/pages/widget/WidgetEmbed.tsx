
import React from "react";
import { useParams } from "react-router-dom";
import WidgetLoading from "./components/WidgetLoading";
import WidgetError from "./components/WidgetError";
import WidgetContainer from "./components/WidgetContainer";
import MessagesOnlyView from "./components/MessagesOnlyView";
import { useWidgetConfig } from "./hooks/useWidgetConfig";
import { useChatMessages } from "./hooks/useChatMessages";

const WidgetEmbed: React.FC = () => {
  const { widgetId } = useParams<{ widgetId: string }>();
  const { 
    loading, 
    error, 
    config, 
    messages, 
    setMessages,
    conversationId,
    setConversationId
  } = useWidgetConfig(widgetId);

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
    return <WidgetLoading />;
  }

  if (error || !config) {
    return <WidgetError error={error} />;
  }

  const { appearance, content, colors } = config.config;
  const hideBackground = appearance?.hideBackground || false;

  return hideBackground ? (
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
  );
};

export default WidgetEmbed;
