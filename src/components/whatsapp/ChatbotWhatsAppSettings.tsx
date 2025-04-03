
import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ChatbotWhatsAppSettingsProps {
  chatbotId: string;
}

export const ChatbotWhatsAppSettings: React.FC<ChatbotWhatsAppSettingsProps> = ({ chatbotId }) => {
  const [isActive, setIsActive] = useState(false);
  const [isActiveChatbot, setIsActiveChatbot] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasWhatsAppConfig, setHasWhatsAppConfig] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        
        // Obtener la configuración de WhatsApp del usuario
        const { data: whatsAppConfig, error: whatsAppError } = await supabase
          .from('user_whatsapp_config')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (whatsAppError) {
          if (whatsAppError.code !== 'PGRST116') { // No rows returned
            console.error("Error al obtener configuración de WhatsApp:", whatsAppError);
          }
          setHasWhatsAppConfig(false);
          return;
        }
        
        setHasWhatsAppConfig(true);
        setIsActive(whatsAppConfig.is_active);
        setIsActiveChatbot(whatsAppConfig.active_chatbot_id === chatbotId);
        
      } catch (error) {
        console.error("Error al cargar configuración:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [chatbotId, user?.id]);

  const handleToggleActive = async (checked: boolean) => {
    if (!user?.id) return;
    
    setIsSaving(true);
    
    try {
      // Actualizar la configuración de WhatsApp
      const { error } = await supabase
        .from('user_whatsapp_config')
        .update({
          is_active: checked
        })
        .eq('user_id', user.id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      setIsActive(checked);
      
      toast({
        title: checked ? "WhatsApp activado" : "WhatsApp desactivado",
        description: checked 
          ? "Tu chatbot ahora podrá responder mensajes de WhatsApp" 
          : "Tu chatbot ya no responderá mensajes de WhatsApp",
      });
      
    } catch (error: any) {
      console.error("Error al actualizar estado de WhatsApp:", error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar la configuración",
      });
      
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActiveChatbot = async (checked: boolean) => {
    if (!user?.id) return;
    
    setIsSaving(true);
    
    try {
      // Actualizar el chatbot activo
      const { error } = await supabase
        .from('user_whatsapp_config')
        .update({
          active_chatbot_id: checked ? chatbotId : null
        })
        .eq('user_id', user.id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      setIsActiveChatbot(checked);
      
      toast({
        title: checked ? "Chatbot activado para WhatsApp" : "Chatbot desactivado para WhatsApp",
        description: checked 
          ? "Este chatbot ahora responderá los mensajes de WhatsApp" 
          : "Este chatbot ya no responderá mensajes de WhatsApp",
      });
      
    } catch (error: any) {
      console.error("Error al actualizar chatbot activo:", error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar la configuración",
      });
      
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasWhatsAppConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Canal de WhatsApp</CardTitle>
          <CardDescription>
            Configura WhatsApp para permitir que tu chatbot responda mensajes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 p-4 rounded-lg border text-center">
            <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium mb-1">WhatsApp no configurado</h3>
            <p className="text-sm text-muted-foreground">
              Para usar este canal, primero debes configurar WhatsApp en la sección de 
              Configuración &gt; WhatsApp.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Canal de WhatsApp</CardTitle>
        <CardDescription>
          Configura cómo deseas que tu chatbot responda los mensajes de WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="whatsapp-active" className="flex flex-col space-y-1">
            <span>Activar WhatsApp</span>
            <span className="font-normal text-sm text-muted-foreground">
              Habilita o deshabilita el canal de WhatsApp para todos tus chatbots
            </span>
          </Label>
          <Switch
            id="whatsapp-active"
            checked={isActive}
            onCheckedChange={handleToggleActive}
            disabled={isSaving}
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="whatsapp-active-chatbot" className="flex flex-col space-y-1">
            <span>Asignar este chatbot a WhatsApp</span>
            <span className="font-normal text-sm text-muted-foreground">
              Establece este chatbot como el que responderá a los mensajes de WhatsApp
            </span>
          </Label>
          <Switch
            id="whatsapp-active-chatbot"
            checked={isActiveChatbot}
            onCheckedChange={handleToggleActiveChatbot}
            disabled={isSaving || !isActive}
          />
        </div>
        
        {isActive && isActiveChatbot && (
          <div className="bg-green-50 border-green-200 border p-4 rounded-lg text-green-800 text-sm">
            <p className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2 text-green-600" />
              <strong>Activo:</strong> Este chatbot está respondiendo mensajes de WhatsApp.
            </p>
          </div>
        )}
        
        {isActive && !isActiveChatbot && (
          <div className="bg-amber-50 border-amber-200 border p-4 rounded-lg text-amber-800 text-sm">
            <p>
              Para recibir mensajes, debes asignar este chatbot a WhatsApp habilitando la opción anterior.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatbotWhatsAppSettings;
