
import React from "react";

interface Message {
  role: string;
  content: string;
}

interface MessagesOnlyViewProps {
  messages: Message[];
  sending: boolean;
  welcomeMessage?: string;
  userBubbleColor?: string;
  botBubbleColor?: string;
  textColor?: string;
}

const MessagesOnlyView: React.FC<MessagesOnlyViewProps> = ({
  messages,
  sending,
  userBubbleColor = "#2563eb",
  botBubbleColor = "#f1f5f9",
  textColor = "#333333"
}) => {
  const DEFAULT_COLORS = {
    text: "#333333",
    bot_bubble: "#f1f5f9",
    user_bubble: "#2563eb",
    links: "#0078ff"
  };

  return (
    <div 
      className="h-full flex flex-col"
      style={{ 
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          flex: '1 1 auto',
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              style={{
                backgroundColor: msg.role === 'user' ? userBubbleColor : botBubbleColor,
                color: msg.role === 'user' ? '#ffffff' : textColor,
                padding: '8px 12px',
                borderRadius: msg.role === 'user' ? '18px 18px 0 18px' : '18px 18px 18px 0',
                maxWidth: '80%',
                overflowWrap: 'break-word',
                textAlign: 'left'
              }}
              dangerouslySetInnerHTML={{
                __html: msg.content.replace(
                  /(https?:\/\/[^\s]+)/g, 
                  `<a href="$1" target="_blank" style="color: ${DEFAULT_COLORS.links};">$1</a>`
                ).replace(/\n/g, '<br>')
              }}
            />
          </div>
        ))}
        
        {sending && (
          <div className="flex justify-start">
            <div 
              style={{
                backgroundColor: botBubbleColor,
                color: textColor,
                padding: '8px 12px',
                borderRadius: '18px 18px 18px 0',
                display: 'inline-block',
                textAlign: 'left'
              }}
            >
              <span className="text-muted">Escribiendo...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesOnlyView;
