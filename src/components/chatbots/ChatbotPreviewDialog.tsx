
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
import { Eye, X } from "lucide-react";
import { ShareSettingsType } from "./ShareSettings";

interface ChatbotPreviewDialogProps {
  chatbotId: string;
  widgetConfig: ShareSettingsType | null;
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
          <Button variant="outline" className="gap-2 group" type="button">
            <Eye className="h-4 w-4 group-hover:animate-pulse" /> 
            Preview
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 overflow-hidden">
        <div className="p-4 bg-muted/30 border-b">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2 text-primary" /> 
              Widget Preview
            </DialogTitle>
            <DialogDescription>
              This is how your chatbot will appear when embedded on your website
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="flex-1 p-6 overflow-auto">
          <div className="h-full border rounded-md overflow-hidden shadow-md" 
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
                <button className="text-white/80 hover:text-white transition-colors">
                  <X className="h-4 w-4" />
                </button>
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
                  How can I help you today?
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
                  I'm here to answer your questions. What can I help you with?
                </div>
              </div>
            </div>
            
            {/* Input */}
            <div className="p-3 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={content?.placeholder_text || "Type a message..."}
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
                  Send
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
                  href="https://flashbot.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#999', textDecoration: 'none' }}
                >
                  Powered by Flashbot
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
