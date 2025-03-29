
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";

// Interface for widget configuration (same as in ShareSettings.tsx)
interface ShareSettings {
  widget_id?: string;
  enabled?: boolean;
  appearance?: {
    position?: string;
    theme?: string;
    initial_state?: string;
    offset_x?: number;
    offset_y?: number;
    width?: number;
    height?: number;
    border_radius?: number;
    box_shadow?: boolean;
    z_index?: number;
  };
  content?: {
    title?: string;
    subtitle?: string;
    placeholder_text?: string;
    welcome_message?: string;
    branding?: boolean;
  };
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
    user_bubble?: string;
    bot_bubble?: string;
    links?: string;
  };
  behavior?: {
    auto_open?: boolean;
    auto_open_delay?: number;
    persist_conversation?: boolean;
    save_conversation_id?: boolean;
  };
  restrictions?: {
    allowed_domains?: string[];
  };
}

interface ChatbotPreviewDialogProps {
  chatbotId: string;
  widgetConfig: ShareSettings | null;
  children?: React.ReactNode;
}

const ChatbotPreviewDialog = ({ chatbotId, widgetConfig, children }: ChatbotPreviewDialogProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!widgetConfig) return null;

  const { appearance, content, colors, behavior } = widgetConfig;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="gap-2">
            <Eye className="h-4 w-4" /> Vista Previa
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Vista Previa del Chatbot</DialogTitle>
          <DialogDescription>
            Así se verá tu chatbot cuando sea incrustado en un sitio web
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 mt-4 border rounded-md overflow-hidden">
          <div className="h-full" 
            style={{ 
              backgroundColor: colors?.background || '#ffffff',
              color: colors?.text || '#333333',
              borderRadius: `${appearance?.border_radius || 8}px`,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
            {/* Header */}
            <div className="p-4" style={{ backgroundColor: colors?.primary || '#2563eb', color: '#ffffff' }}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{content?.title || 'Chat'}</h3>
                  {content?.subtitle && <p className="text-sm opacity-90">{content?.subtitle}</p>}
                </div>
              </div>
            </div>
            
            {/* Messages */}
            <div 
              className="flex-1 p-4 overflow-y-auto"
              style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {content?.welcome_message && (
                <div className="flex justify-start">
                  <div 
                    style={{
                      backgroundColor: colors?.bot_bubble || '#f1f0f0',
                      color: colors?.text || '#333333',
                      padding: '8px 12px',
                      borderRadius: '18px 18px 18px 0',
                      maxWidth: '80%'
                    }}
                  >
                    {content?.welcome_message}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <div 
                  style={{
                    backgroundColor: colors?.user_bubble || colors?.primary || '#2563eb',
                    color: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '18px 18px 0 18px',
                    maxWidth: '80%'
                  }}
                >
                  ¿Cómo puedo ayudarte hoy?
                </div>
              </div>
              
              <div className="flex justify-start">
                <div 
                  style={{
                    backgroundColor: colors?.bot_bubble || '#f1f0f0',
                    color: colors?.text || '#333333',
                    padding: '8px 12px',
                    borderRadius: '18px 18px 18px 0',
                    maxWidth: '80%'
                  }}
                >
                  Estoy aquí para responder tus preguntas. ¿En qué puedo ayudarte?
                </div>
              </div>
            </div>
            
            {/* Input */}
            <div className="p-3 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={content?.placeholder_text || "Escribe un mensaje..."}
                  className="flex-1 p-2 border rounded"
                  style={{ 
                    borderColor: 'rgba(0,0,0,0.2)',
                    borderRadius: '4px',
                    color: colors?.text || '#333333'
                  }}
                />
                <button
                  type="button"
                  style={{
                    backgroundColor: colors?.primary || '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0 12px',
                    cursor: 'pointer'
                  }}
                >
                  Enviar
                </button>
              </div>
            </div>
            
            {/* Branding */}
            {content?.branding && (
              <div 
                className="p-2 text-center text-xs" 
                style={{ borderTop: '1px solid rgba(0,0,0,0.1)', color: '#999' }}
              >
                <a 
                  href="https://lovable.dev" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#999', textDecoration: 'none' }}
                >
                  Powered by Lovable
                </a>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatbotPreviewDialog;
