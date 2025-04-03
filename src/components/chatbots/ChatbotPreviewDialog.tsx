import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Phone } from "lucide-react";
import { ShareSettings } from "./share/types";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppConfig } from "@/integrations/supabase/whatsappTypes";

interface ChatbotPreviewDialogProps {
  chatbotId: string;
  widgetConfig: ShareSettings | null;
}

const ChatbotPreviewDialog = ({ chatbotId, widgetConfig }: ChatbotPreviewDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'web' | 'whatsapp'>('web');

  // Function to check if WhatsApp is configured and active
  const [isWhatsAppConfigured, setIsWhatsAppConfigured] = useState<boolean | null>(null);
  const [isWhatsAppActive, setIsWhatsAppActive] = useState<boolean>(false);
  const [isThisChatbotActive, setIsThisChatbotActive] = useState<boolean>(false);

  const checkWhatsAppConfig = async () => {
    try {
      // Using the rpc function to get WhatsApp config
      const { data, error } = await supabase
        .rpc('get_user_whatsapp_config');
      
      if (error) {
        console.error("Error checking WhatsApp configuration:", error);
        setIsWhatsAppConfigured(false);
        return;
      }
      
      if (data) {
        const config = data as WhatsAppConfig;
        setIsWhatsAppConfigured(true);
        setIsWhatsAppActive(config.is_active || false);
        setIsThisChatbotActive(config.active_chatbot_id === chatbotId);
      } else {
        setIsWhatsAppConfigured(false);
      }
    } catch (error) {
      console.error("Error checking WhatsApp:", error);
      setIsWhatsAppConfigured(false);
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (open) {
      checkWhatsAppConfig();
    }
    setIsOpen(open);
  };

  const getWhatsAppStatusText = () => {
    if (isWhatsAppConfigured === null) {
      return "Verificando estado de WhatsApp...";
    }
    
    if (!isWhatsAppConfigured) {
      return "WhatsApp no está configurado";
    }
    
    if (!isWhatsAppActive) {
      return "WhatsApp está desactivado";
    }
    
    if (!isThisChatbotActive) {
      return "Este chatbot no está asignado a WhatsApp";
    }
    
    return "Activo: Este chatbot responde mensajes de WhatsApp";
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={() => handleOpenChange(true)}
      >
        <Eye className="h-4 w-4" />
        Vista previa
      </Button>
      
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Vista previa del chatbot</DialogTitle>
            <div className="flex space-x-2 pt-2">
              <Button 
                variant={previewMode === 'web' ? "default" : "outline"}
                size="sm"
                onClick={() => setPreviewMode('web')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Web
              </Button>
              <Button
                variant={previewMode === 'whatsapp' ? "default" : "outline"}
                size="sm"
                onClick={() => setPreviewMode('whatsapp')}
              >
                <Phone className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            {previewMode === 'web' ? (
              <div className="relative w-full h-full min-h-[500px] bg-muted/30 rounded-md border overflow-hidden">
                <iframe 
                  src={`${window.location.origin}/widget/${chatbotId}`}
                  className="absolute inset-0 w-full h-full"
                ></iframe>
              </div>
            ) : (
              <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center space-y-4 bg-muted/30 rounded-md border p-8">
                <Phone className="h-16 w-16 text-muted-foreground" />
                <h3 className="text-xl font-semibold">Canal de WhatsApp</h3>
                
                <Badge variant={isThisChatbotActive && isWhatsAppActive ? "default" : "outline"}>
                  {getWhatsAppStatusText()}
                </Badge>
                
                <div className="text-center text-muted-foreground mt-4 max-w-md space-y-4">
                  <p>
                    La vista previa para WhatsApp no está disponible directamente.
                    Para probar el chatbot, envía un mensaje al número de WhatsApp configurado.
                  </p>
                  
                  {(!isWhatsAppConfigured || !isWhatsAppActive || !isThisChatbotActive) && (
                    <div className="bg-muted p-4 rounded-md text-sm">
                      <p className="font-medium">Para activar WhatsApp:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Configura tu cuenta en Configuración &gt; WhatsApp</li>
                        <li>Activa WhatsApp para tu cuenta</li>
                        <li>Asigna este chatbot como el activo para WhatsApp</li>
                      </ul>
                    </div>
                  )}
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/settings/whatsapp'}
                >
                  Ir a configuración de WhatsApp
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatbotPreviewDialog;
