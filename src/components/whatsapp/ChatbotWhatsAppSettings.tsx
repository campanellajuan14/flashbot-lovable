
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { MessageSquare, ArrowUpRight, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppConfig } from '@/integrations/supabase/whatsappTypes';

const ChatbotWhatsAppSettings = () => {
  const { toast } = useToast();
  const { id: chatbotId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Cargar la configuración de WhatsApp
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        
        // Obtener la configuración actual de WhatsApp
        const { data, error } = await supabase
          .rpc<WhatsAppConfig>('get_user_whatsapp_config');
          
        if (error) {
          console.error("Error loading WhatsApp configuration:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo cargar la configuración de WhatsApp",
          });
          return;
        }
        
        // Si hay configuración, actualizar el estado
        if (data) {
          setConfig(data);
          setIsActive(!!data.is_active);
          setIsEnabled(data.active_chatbot_id === chatbotId);
        }
      } catch (err) {
        console.error("Error:", err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Ocurrió un error al cargar la configuración",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (chatbotId) {
      loadConfig();
    }
  }, [chatbotId, toast]);

  // Manejar cambio en el estado de activación del chatbot
  const handleEnableToggle = async () => {
    if (!config) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay configuración de WhatsApp. Configúrela primero.",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Activar/desactivar este chatbot
      const newChatbotId = isEnabled ? null : chatbotId;
      
      // Actualizar en la base de datos
      const { error } = await supabase
        .rpc('update_whatsapp_active_chatbot', {
          chatbot_id_value: newChatbotId
        });
        
      if (error) {
        throw new Error(error.message);
      }
      
      // Actualizar el estado local
      setIsEnabled(!isEnabled);
      setConfig(prev => prev ? {
        ...prev,
        active_chatbot_id: newChatbotId
      } : null);
      
      toast({
        title: isEnabled ? "Chatbot desactivado" : "Chatbot activado",
        description: isEnabled 
          ? "Este chatbot ya no responderá mensajes de WhatsApp" 
          : "Este chatbot ahora responderá mensajes de WhatsApp",
      });
      
    } catch (err) {
      console.error("Error toggling chatbot:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la configuración",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Manejar cambio en el estado general de WhatsApp
  const handleActivationToggle = async () => {
    if (!config) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay configuración de WhatsApp. Configúrela primero.",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Activar/desactivar WhatsApp
      const { error } = await supabase
        .rpc('update_whatsapp_config_status', {
          is_active_value: !isActive
        });
        
      if (error) {
        throw new Error(error.message);
      }
      
      // Actualizar el estado local
      setIsActive(!isActive);
      setConfig(prev => prev ? {
        ...prev,
        is_active: !isActive
      } : null);
      
      toast({
        title: isActive ? "WhatsApp desactivado" : "WhatsApp activado",
        description: isActive 
          ? "Los mensajes de WhatsApp ya no serán procesados" 
          : "Los mensajes de WhatsApp ahora serán procesados",
      });
      
    } catch (err) {
      console.error("Error toggling WhatsApp:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la configuración",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Si no hay configuración, mostrar mensaje
  if (!isLoading && !config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Integración con WhatsApp
          </CardTitle>
          <CardDescription>
            Configure primero su cuenta de WhatsApp Business en la sección de Configuración.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/settings/whatsapp'}
            className="flex items-center gap-2"
          >
            Ir a Configuración de WhatsApp <ArrowUpRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Integración con WhatsApp
        </CardTitle>
        <CardDescription>
          Configure la integración de este chatbot con WhatsApp Business.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="whatsapp-status" className="font-medium">Estado de WhatsApp</Label>
            <div className="flex items-center gap-2">
              {isActive ? (
                <span className="text-sm text-green-600 flex items-center gap-1 font-medium">
                  <Check className="h-4 w-4" /> Activo
                </span>
              ) : (
                <span className="text-sm text-red-600 flex items-center gap-1 font-medium">
                  <X className="h-4 w-4" /> Inactivo
                </span>
              )}
              <Switch
                id="whatsapp-status"
                checked={isActive}
                onCheckedChange={handleActivationToggle}
                disabled={isLoading || isSaving}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {isActive 
              ? "WhatsApp está activo y procesando mensajes entrantes." 
              : "WhatsApp está desactivado. No se procesarán mensajes entrantes."}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="chatbot-whatsapp" className="font-medium">Activar este chatbot para WhatsApp</Label>
            <div className="flex items-center gap-2">
              {isEnabled ? (
                <span className="text-sm text-green-600 flex items-center gap-1 font-medium">
                  <Check className="h-4 w-4" /> Activo
                </span>
              ) : (
                <span className="text-sm text-red-600 flex items-center gap-1 font-medium">
                  <X className="h-4 w-4" /> Inactivo
                </span>
              )}
              <Switch
                id="chatbot-whatsapp"
                checked={isEnabled}
                onCheckedChange={handleEnableToggle}
                disabled={isLoading || isSaving || !config}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {isEnabled 
              ? "Este chatbot está configurado para responder mensajes de WhatsApp." 
              : "Este chatbot no responderá mensajes de WhatsApp."}
          </p>
          
          {isEnabled && config?.active_chatbot_id === chatbotId && (
            <div className="bg-green-50 border border-green-200 rounded p-3 mt-3">
              <p className="text-sm text-green-700 font-medium">
                Este chatbot está actualmente configurado como respuesta automática para tu cuenta de WhatsApp.
              </p>
            </div>
          )}
          
          {config?.active_chatbot_id && config.active_chatbot_id !== chatbotId && (
            <div className="bg-amber-50 border border-amber-200 rounded p-3 mt-3">
              <p className="text-sm text-amber-700">
                Actualmente hay otro chatbot configurado para responder a WhatsApp. 
                Si activas este chatbot, el otro será desactivado.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3 pt-2">
          <Label className="font-medium">Estado del webhook</Label>
          <div className="flex items-center gap-2">
            {config?.webhook_verified ? (
              <span className="text-sm text-green-600 flex items-center gap-1 font-medium">
                <Check className="h-4 w-4" /> Verificado
              </span>
            ) : (
              <span className="text-sm text-amber-600 flex items-center gap-1 font-medium">
                <X className="h-4 w-4" /> No verificado
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {config?.webhook_verified 
              ? "El webhook de WhatsApp está correctamente verificado." 
              : "El webhook de WhatsApp no está verificado. Configure el webhook en Meta Business Suite."}
          </p>
          
          <div className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/settings/whatsapp'}
              className="flex items-center gap-2"
            >
              Ir a Configuración de WhatsApp <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatbotWhatsAppSettings;
