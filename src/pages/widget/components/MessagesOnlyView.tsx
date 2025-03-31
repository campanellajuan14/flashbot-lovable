
import React from "react";

interface MessagesOnlyViewProps {
  messages: Array<{ role: string; content: string }>;
  sending: boolean;
  welcomeMessage?: string;
  userBubbleColor?: string;
  botBubbleColor?: string;
  textColor?: string;
}

const MessagesOnlyView: React.FC<MessagesOnlyViewProps> = ({
  messages,
  sending,
  welcomeMessage,
  userBubbleColor = "#2563eb",
  botBubbleColor = "#f1f0f0",
  textColor = "#333333"
}) => {
  return (
    <div className="h-full flex flex-col" 
      style={{ 
        backgroundColor: 'transparent',
        color: textColor,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
      {/* Messages only */}
      {welcomeMessage && (
        <div className="flex justify-start">
          <div 
            style={{
              backgroundColor: botBubbleColor,
              color: textColor,
              padding: '8px 12px',
              borderRadius: '18px 18px 18px 0',
              maxWidth: '80%',
              textAlign: 'left'
            }}
          >
            {welcomeMessage}
          </div>
        </div>
      )}
      
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
              textAlign: 'left'
            }}
            dangerouslySetInnerHTML={{
              __html: msg.content.replace(/\n/g, '<br>')
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
  );
};

export default MessagesOnlyView;
