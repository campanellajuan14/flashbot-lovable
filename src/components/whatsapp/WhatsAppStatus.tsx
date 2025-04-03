
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Copy, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { WhatsAppConfig } from '@/integrations/supabase/whatsappTypes';

const WhatsAppStatus = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chatbots, setChatbots] = useState<Array<{id: string, name: string}>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedChatbot, setSelectedChatbot] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        
        // Fetch WhatsApp configuration
        const { data: whatsappConfig, error: configError } = await supabase
          .rpc<WhatsAppConfig>('get_user_whatsapp_config');
          
        if (configError) {
          console.error("Error fetching WhatsApp configuration:", configError);
          return;
        }
        
        if (whatsappConfig) {
          setConfig(whatsappConfig);
          setIsActive(whatsappConfig.is_active || false);
          setSelectedChatbot(whatsappConfig.active_chatbot_id);
        }
        
        // Fetch user's chatbots
        const { data: chatbotData, error: chatbotError } = await supabase
          .from('chatbots')
          .select('id, name')
          .eq('user_id', user.id);
          
        if (chatbotError) {
          console.error("Error fetching chatbots:", chatbotError);
          return;
        }
        
        setChatbots(chatbotData);
      } catch (error) {
        console.error("Error loading WhatsApp status:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user?.id]);
  
  const handleToggleActive = async (checked: boolean) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .rpc('update_whatsapp_config_status', {
          is_active_value: checked
        });
        
      if (error) throw new Error(error.message);
      
      setIsActive(checked);
      setConfig(prev => prev ? {...prev, is_active: checked} : null);
      
      toast({
        title: checked ? "WhatsApp activado" : "WhatsApp desactivado",
        description: checked 
          ? "Tu chatbot ahora responderá mensajes de WhatsApp" 
          : "Tu chatbot ya no responderá mensajes de WhatsApp",
      });
    } catch (error: any) {
      console.error("Error toggling WhatsApp status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el estado",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleChangeChatbot = async (chatbotId: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .rpc('update_whatsapp_active_chatbot', {
          chatbot_id_value: chatbotId
        });
        
      if (error) throw new Error(error.message);
      
      setSelectedChatbot(chatbotId);
      setConfig(prev => prev ? {...prev, active_chatbot_id: chatbotId} : null);
      
      toast({
        title: "Chatbot asignado",
        description: "Este chatbot responderá a tus mensajes de WhatsApp",
      });
    } catch (error: any) {
      console.error("Error changing active chatbot:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el chatbot activo",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const copyToClipboard = (text: string, successMessage: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copiado",
        description: successMessage,
      });
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estado de WhatsApp</CardTitle>
          <CardDescription>
            Estado de tu integración con WhatsApp Business API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 p-4 rounded-lg border text-center">
            <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium mb-1">WhatsApp no configurado</h3>
            <p className="text-sm text-muted-foreground">
              Completa la configuración en la sección de WhatsApp primero.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const webhookUrl = `${window.location.origin.replace('http://', 'https://')}/api/whatsapp-webhook?phone_number_id=${config.phone_number_id}`;
  const verificationToken = config.webhook_verify_token;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado de WhatsApp</CardTitle>
        <CardDescription>
          Estado de tu integración con WhatsApp Business API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/30 p-4 rounded-lg border">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Estado</h3>
              <p className={`font-medium flex items-center mt-1 ${isActive ? 'text-green-600' : 'text-amber-600'}`}>
                {isActive ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Activo
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Inactivo
                  </>
                )}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Webhook Verificado</h3>
              <p className={`font-medium flex items-center mt-1 ${config.webhook_verified ? 'text-green-600' : 'text-amber-600'}`}>
                {config.webhook_verified ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Sí
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 mr-1" />
                    No
                  </>
                )}
              </p>
            </div>
            <div className="col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground">Phone Number ID</h3>
              <p className="font-medium mt-1">{config.phone_number_id}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Configuración del Webhook</h3>
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="webhook-url">URL del Webhook</Label>
              <div className="flex">
                <input
                  id="webhook-url"
                  type="text"
                  value={`https://obiiomoqhpbgaymfphdz.supabase.co/functions/v1/whatsapp-webhook?phone_number_id=${config.phone_number_id}`}
                  readOnly
                  className="flex-1 p-2 border rounded-l-md bg-muted"
                />
                <Button 
                  variant="secondary"
                  className="rounded-l-none"
                  onClick={() => copyToClipboard(
                    `https://obiiomoqhpbgaymfphdz.supabase.co/functions/v1/whatsapp-webhook?phone_number_id=${config.phone_number_id}`, 
                    "URL del webhook copiada al portapapeles"
                  )}
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Label htmlFor="verify-token">Token de verificación</Label>
              <div className="flex">
                <input
                  id="verify-token"
                  type="text"
                  value={verificationToken}
                  readOnly
                  className="flex-1 p-2 border rounded-l-md bg-muted"
                />
                <Button 
                  variant="secondary"
                  className="rounded-l-none"
                  onClick={() => copyToClipboard(
                    verificationToken,
                    "Token de verificación copiado al portapapeles"
                  )}
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4 border-t pt-4 mt-4">
          <h3 className="text-lg font-medium">Activar integración</h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="whatsapp-chatbot" className="flex flex-col">
                <span>Chatbot para WhatsApp</span>
                <span className="font-normal text-sm text-muted-foreground">
                  Selecciona el chatbot que responderá a los mensajes
                </span>
              </Label>
              <Select 
                value={selectedChatbot || ""} 
                onValueChange={handleChangeChatbot}
                disabled={chatbots.length === 0 || isSaving}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Seleccionar chatbot" />
                </SelectTrigger>
                <SelectContent>
                  {chatbots.map(chatbot => (
                    <SelectItem key={chatbot.id} value={chatbot.id}>
                      {chatbot.name}
                    </SelectItem>
                  ))}
                  {chatbots.length === 0 && (
                    <SelectItem value="none" disabled>
                      No hay chatbots disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="whatsapp-active" className="flex flex-col">
                <span>Activar WhatsApp</span>
                <span className="font-normal text-sm text-muted-foreground">
                  Habilita o deshabilita la integración con WhatsApp
                </span>
              </Label>
              <Switch
                id="whatsapp-active"
                checked={isActive}
                onCheckedChange={handleToggleActive}
                disabled={!selectedChatbot || isSaving}
              />
            </div>
          </div>
          
          {isActive && selectedChatbot && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-green-800">
              <p className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                <strong>WhatsApp activado:</strong> Tu chatbot está configurado para responder mensajes de WhatsApp.
              </p>
            </div>
          )}
          
          {(!isActive || !selectedChatbot) && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-amber-800">
              <p className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                <strong>WhatsApp inactivo:</strong> Configura un chatbot y activa WhatsApp para empezar a recibir mensajes.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppStatus;
