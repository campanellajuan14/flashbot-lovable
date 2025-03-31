
import React from "react";
import WidgetHeader from "./WidgetHeader";
import WidgetMessages from "./WidgetMessages";
import WidgetMessageInput from "./WidgetMessageInput";
import WidgetBranding from "./WidgetBranding";

interface WidgetConfig {
  appearance?: {
    border_radius?: number;
  };
  content?: {
    title?: string;
    subtitle?: string;
    placeholder_text?: string;
    branding?: boolean;
  };
  colors?: {
    background?: string;
    primary?: string;
    text?: string;
    user_bubble?: string;
    bot_bubble?: string;
  };
}

interface WidgetContainerProps {
  config: WidgetConfig;
  messages: Array<{ role: string; content: string }>;
  inputValue: string;
  sending: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSendMessage: (e: React.FormEvent) => void;
}

const DEFAULT_COLORS = {
  text: "#333333",
  background: "#ffffff",
  primary: "#2563eb",
  bot_bubble: "#f1f5f9",
  user_bubble: "#2563eb",
};

const WidgetContainer: React.FC<WidgetContainerProps> = ({
  config,
  messages,
  inputValue,
  sending,
  handleInputChange,
  handleSendMessage,
}) => {
  const { appearance, content, colors } = config;

  return (
    <div 
      className="h-full border rounded-md overflow-hidden shadow-md flex flex-col" 
      style={{ 
        backgroundColor: colors?.background || DEFAULT_COLORS.background,
        color: colors?.text || DEFAULT_COLORS.text,
        borderRadius: `${appearance?.border_radius || 8}px`,
      }}
    >
      <WidgetHeader 
        title={content?.title} 
        subtitle={content?.subtitle}
        primaryColor={colors?.primary}
      />
      
      <WidgetMessages 
        messages={messages}
        sending={sending}
        userBubbleColor={colors?.user_bubble}
        botBubbleColor={colors?.bot_bubble}
        textColor={colors?.text}
      />
      
      <div className="mt-auto">
        <WidgetMessageInput 
          inputValue={inputValue}
          handleInputChange={handleInputChange}
          handleSendMessage={handleSendMessage}
          sending={sending}
          placeholder={content?.placeholder_text}
          primaryColor={colors?.primary}
          textColor={colors?.text}
        />
        
        <WidgetBranding showBranding={content?.branding} />
      </div>
    </div>
  );
};

export default WidgetContainer;
