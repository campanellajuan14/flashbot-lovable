
import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Alert,
  AlertDescription,
  AlertTitle
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  X, 
  AlertTriangle, 
  Copy, 
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { WhatsAppConfig } from '@/integrations/supabase/whatsappTypes';

export const WhatsAppStatus = () => {
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  // URL de la Edge Function de Webhook
  const webhookUrl = `https://obiiomoqhpbgaymfphdz.supabase.co/functions/v1/whatsapp-webhook`;

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .rpc<WhatsAppConfig>('get_user_whatsapp_config');

        if (error) {
          console.error('Error loading configuration:', error);
          setConfig(null);
        } else if (data) {
          setConfig(data as WhatsAppConfig);
        } else {
          setConfig(null);
        }
      } catch (err) {
        console.error('Error loading configuration:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({
          title: "Copiado",
          description: message,
        });
      })
      .catch((err) => {
        console.error('Error al copiar:', err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo copiar al portapapeles",
        });
      });
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-[200px]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Estado de WhatsApp</CardTitle>
          <CardDescription>
            No se ha encontrado configuración de WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Sin configuración</AlertTitle>
            <AlertDescription>
              Por favor, completa la configuración de WhatsApp primero.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Estado de WhatsApp</CardTitle>
        <CardDescription>
          Estado de tu integración con WhatsApp Business API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado general */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Estado</span>
          <div className="flex items-center gap-2">
            <Badge 
              variant={config.is_active ? "default" : "outline"}
              className={`${config.is_active ? "bg-green-600 hover:bg-green-700" : ""}`}
            >
              {config.is_active ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Activo
                </>
              ) : (
                <>
                  <X className="h-3 w-3 mr-1" />
                  Inactivo
                </>
              )}
            </Badge>
            
            <Badge 
              variant={config.webhook_verified ? "default" : "outline"}
              className={`${config.webhook_verified ? "bg-green-600 hover:bg-green-700" : ""}`}
            >
              {config.webhook_verified ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Webhook Verificado
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Webhook Pendiente
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Phone Number ID */}
        <div>
          <div className="text-sm font-medium mb-1">Phone Number ID</div>
          <div className="text-sm text-muted-foreground">{config.phone_number_id}</div>
        </div>

        {/* Instrucciones del Webhook */}
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <h4 className="font-medium">Configuración del Webhook</h4>
          
          {!config.webhook_verified && (
            <Alert className="bg-amber-50 text-amber-900 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle>Webhook no verificado</AlertTitle>
              <AlertDescription>
                Para recibir mensajes de WhatsApp, debes configurar y verificar el webhook en Meta Developer Portal.
              </AlertDescription>
            </Alert>
          )}
          
          <div>
            <div className="text-sm font-medium mb-1">URL del Webhook</div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                {webhookUrl}?phone_number_id={config.phone_number_id}
              </div>
              <Button 
                size="icon" 
                variant="outline" 
                className="h-6 w-6" 
                onClick={() => copyToClipboard(`${webhookUrl}?phone_number_id=${config.phone_number_id}`, "URL del webhook copiada")}
              >
                <Copy className="h-3 w-3" />
                <span className="sr-only">Copiar URL</span>
              </Button>
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-1">Token de verificación</div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground font-mono bg-muted p-1 rounded">
                {config.webhook_verify_token}
              </div>
              <Button 
                size="icon" 
                variant="outline" 
                className="h-6 w-6" 
                onClick={() => copyToClipboard(config.webhook_verify_token, "Token de verificación copiado")}
              >
                <Copy className="h-3 w-3" />
                <span className="sr-only">Copiar token</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Links útiles */}
        <div className="flex flex-col pt-2 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="justify-start"
            asChild
          >
            <a 
              href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Documentación de WhatsApp Cloud API
            </a>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="justify-start"
            asChild
          >
            <a 
              href="https://business.facebook.com/settings/whatsapp-business-accounts" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Gestionar cuenta de WhatsApp Business
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppStatus;
