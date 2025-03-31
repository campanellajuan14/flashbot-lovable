
import React from "react";

interface WidgetMessageInputProps {
  inputValue: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  sending: boolean;
  placeholder?: string;
  primaryColor?: string;
  textColor?: string;
}

const WidgetMessageInput: React.FC<WidgetMessageInputProps> = ({
  inputValue,
  handleInputChange,
  handleSendMessage,
  sending,
  placeholder = "Escribe un mensaje...",
  primaryColor = "#2563eb",
  textColor = "#333333"
}) => {
  return (
    <div className="p-3 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="flex-1 p-2 border rounded"
          style={{ 
            borderColor: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
            color: textColor
          }}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || sending}
          style={{
            backgroundColor: primaryColor,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '0 12px',
            cursor: inputValue.trim() && !sending ? 'pointer' : 'default',
            opacity: inputValue.trim() && !sending ? 1 : 0.7
          }}
        >
          Enviar
        </button>
      </form>
    </div>
  );
};

export default WidgetMessageInput;
