
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRight, Check, MessageSquare, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ChatbotWhatsAppSettingsProps {
  chatbotId: string;
}

const ChatbotWhatsAppSettings = ({ chatbotId }: ChatbotWhatsAppSettingsProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      try {
        // Fetch WhatsApp configuration
        const { data: whatsappConfig, error: configError } = await supabase
          .rpc('get_user_whatsapp_config');
          
        if (configError) {
          console.error("Error fetching WhatsApp configuration:", configError);
          return;
        }
        
        setConfig(whatsappConfig);
        
        // Check if this chatbot is already active
        if (whatsappConfig && whatsappConfig.active_chatbot_id === chatbotId) {
          setIsActive(true);
        }
      } catch (error) {
        console.error("Error loading WhatsApp status:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConfig();
  }, [chatbotId]);
  
  const activateChatbot = async () => {
    setIsSaving(true);
    try {
      // Set this chatbot as active
      const { error: chatbotError } = await supabase
        .rpc('update_whatsapp_active_chatbot', {
          chatbot_id_value: chatbotId
        });
        
      if (chatbotError) throw new Error(chatbotError.message);
      
      // Update active status if not already active
      if (!config?.is_active) {
        const { error: statusError } = await supabase
          .rpc('update_whatsapp_config_status', {
            is_active_value: true
          });
          
        if (statusError) throw new Error(statusError.message);
      }
      
      setIsActive(true);
      setConfig(prev => prev ? {...prev, active_chatbot_id: chatbotId, is_active: true} : null);
      
      toast({
        title: "WhatsApp activado",
        description: "Este chatbot responderá ahora a los mensajes de WhatsApp",
      });
    } catch (error: any) {
      console.error("Error setting WhatsApp chatbot:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo activar WhatsApp para este chatbot",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const deactivateChatbot = async () => {
    setIsSaving(true);
    try {
      // Set another chatbot as active or null
      const { error: chatbotError } = await supabase
        .rpc('update_whatsapp_active_chatbot', {
          chatbot_id_value: null
        });
        
      if (chatbotError) throw new Error(chatbotError.message);
      
      setIsActive(false);
      setConfig(prev => prev ? {...prev, active_chatbot_id: null} : null);
      
      toast({
        title: "WhatsApp desactivado",
        description: "Este chatbot ya no responderá a los mensajes de WhatsApp",
      });
    } catch (error: any) {
      console.error("Error disabling WhatsApp chatbot:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo desactivar WhatsApp para este chatbot",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const goToWhatsAppSettings = () => {
    navigate('/settings/whatsapp');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp</CardTitle>
          <CardDescription>
            Conecta este chatbot con WhatsApp Business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 p-6 rounded-lg border text-center">
            <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium mb-1">WhatsApp no configurado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Primero necesitas configurar la integración con WhatsApp Business API.
            </p>
            <Button onClick={goToWhatsAppSettings}>
              Configurar WhatsApp
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp</CardTitle>
        <CardDescription>
          Conecta este chatbot con WhatsApp Business
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Activar en WhatsApp</Label>
            <p className="text-sm text-muted-foreground">
              {isActive 
                ? "Este chatbot está respondiendo mensajes de WhatsApp" 
                : "Activa este chatbot para responder mensajes de WhatsApp"}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {isActive ? (
              <Button 
                variant="outline" 
                onClick={deactivateChatbot}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Desactivar
              </Button>
            ) : (
              <Button 
                onClick={activateChatbot}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Activar
              </Button>
            )}
          </div>
        </div>

        {isActive && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Chatbot activo en WhatsApp</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Este chatbot está configurado para responder automáticamente a los mensajes que recibas en WhatsApp Business.</p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-green-800 font-semibold"
                    onClick={goToWhatsAppSettings}
                  >
                    Ver historial de mensajes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatbotWhatsAppSettings;
