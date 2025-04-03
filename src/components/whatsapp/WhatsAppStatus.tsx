import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Copy, MessageSquare, CheckCircle, AlertCircle, SendIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { WhatsAppConfig } from '@/integrations/supabase/whatsappTypes';
import { Input } from '@/components/ui/input';

const WhatsAppStatus = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chatbots, setChatbots] = useState<Array<{id: string, name: string}>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedChatbot, setSelectedChatbot] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [testMessage, setTestMessage] = useState('Mensaje de prueba');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; error?: string; details?: any } | null>(null);
  const [templates, setTemplates] = useState<Array<{name: string; language: string}>>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [languageCode, setLanguageCode] = useState('es');

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        
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

          fetchTemplates(whatsappConfig);
        }
        
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

  const fetchTemplates = async (config: WhatsAppConfig) => {
    try {
      setLoadingTemplates(true);
      
      const { data, error } = await supabase.functions.invoke('whatsapp-api-proxy', {
        body: JSON.stringify({
          action: 'message_templates',
          params: {
            limit: 100
          }
        })
      });
      
      if (error) {
        console.error("Error fetching templates:", error);
        return;
      }
      
      if (data && data.data) {
        const templatesList = data.data.map((template: any) => ({
          name: template.name,
          language: template.language || 'es'
        }));
        
        setTemplates(templatesList);
        
        if (templatesList.length > 0) {
          setSelectedTemplate(templatesList[0].name);
          setLanguageCode(templatesList[0].language);
        }
        
        console.log("Templates loaded:", templatesList);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoadingTemplates(false);
    }
  };
  
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
  
  const handleSendTestMessage = async () => {
    if (!testPhoneNumber || !config) return;
    
    setIsSendingTest(true);
    setTestResult(null);
    
    try {
      const cleanedNumber = testPhoneNumber.replace(/\D/g, '');
      
      const formattedNumber = cleanedNumber.startsWith('34') ? cleanedNumber : `34${cleanedNumber}`;
      
      const messagePayload = {
        action: 'messages',
        params: {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formattedNumber,
          type: "text",
          text: {
            preview_url: false,
            body: testMessage || "Mensaje de prueba desde Flashbot"
          }
        }
      };
      
      console.log("Enviando payload:", messagePayload);
      
      const { data, error } = await supabase.functions.invoke('whatsapp-api-proxy', {
        body: JSON.stringify(messagePayload)
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      console.log("Resultado del envío:", data);
      setTestResult({ 
        success: true, 
        details: data 
      });
      
      toast({
        title: "Mensaje enviado",
        description: `Se ha enviado correctamente un mensaje a ${formattedNumber}`,
      });
    } catch (error: any) {
      console.error("Error al enviar mensaje de prueba:", error);
      setTestResult({ 
        success: false, 
        error: error.message || "Error desconocido", 
        details: error 
      });
      
      toast({
        variant: "destructive",
        title: "Error al enviar mensaje",
        description: error.message || "No se pudo enviar el mensaje de prueba",
      });
    } finally {
      setIsSendingTest(false);
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
          <h3 className="text-lg font-medium">Prueba de envío de mensajes</h3>
          <p className="text-sm text-muted-foreground">
            Envía un mensaje de texto directo para comprobar la conexión con WhatsApp
          </p>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-phone">Número de teléfono (con o sin prefijo)</Label>
              <Input
                id="test-phone"
                placeholder="Ej: 666777888 o 34666777888"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Se añadirá el prefijo 34 (España) si no lo incluyes
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="test-message">Mensaje de prueba</Label>
              <Input
                id="test-message"
                placeholder="Escribe un mensaje de prueba"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={handleSendTestMessage}
              disabled={isSendingTest || !testPhoneNumber}
              className="w-full"
            >
              {isSendingTest ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Enviando...
                </>
              ) : (
                <>
                  <SendIcon className="h-4 w-4 mr-2" />
                  Enviar mensaje de texto directo
                </>
              )}
            </Button>
            
            {testResult && (
              <div className={`mt-4 p-4 rounded-md border text-sm ${
                testResult.success ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
              }`}>
                <h4 className="font-medium mb-2">
                  {testResult.success ? '✅ Mensaje enviado correctamente' : '❌ Error al enviar mensaje'}
                </h4>
                
                {testResult.error && (
                  <div className="mb-2">
                    <strong>Error:</strong> {testResult.error}
                  </div>
                )}
                
                <div className="overflow-auto max-h-32 bg-white/50 p-2 rounded-sm">
                  <pre className="text-xs">
                    {JSON.stringify(testResult.details, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppStatus;
