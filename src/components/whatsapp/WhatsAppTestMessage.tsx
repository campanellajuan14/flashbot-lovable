
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle, AlertCircle, Send, AlertTriangle } from "lucide-react";
import { sendWhatsAppTextMessage } from '@/integrations/supabase/whatsappTemplates';

export const WhatsAppTestMessage = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('Mensaje de prueba');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    messageId?: string;
    error?: string;
    errorType?: string; // token_error, template_error, etc.
  } | null>(null);
  
  const { toast } = useToast();
  
  const handleSend = async () => {
    // Validar el número de teléfono
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El número de teléfono no es válido"
      });
      return;
    }
    
    // Asegurar que el número tiene formato internacional
    let formattedNumber = phoneNumber;
    if (!formattedNumber.startsWith('+')) {
      // Si empieza con el prefijo del país pero sin +, añadir +
      if (/^[0-9]{1,3}/.test(formattedNumber)) {
        formattedNumber = '+' + formattedNumber;
      } else {
        // Asumir número español si no tiene prefijo internacional
        formattedNumber = '+34' + formattedNumber;
      }
    }
    
    setIsLoading(true);
    setResult(null);
    
    try {
      console.log(`Enviando mensaje de prueba a ${formattedNumber}`);
      const response = await sendWhatsAppTextMessage(
        formattedNumber,
        message || 'Mensaje de prueba'
      );
      
      console.log("Mensaje enviado con éxito:", response);
      setResult({
        success: true,
        messageId: response.id
      });
      
      toast({
        title: "Mensaje enviado",
        description: `Mensaje enviado correctamente con ID: ${response.id.substring(0, 8)}...`,
      });
    } catch (error) {
      console.error("Error al enviar mensaje de prueba:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      // Determinar el tipo de error para mostrar mensaje más claro
      const errorType = 
        errorMessage.toLowerCase().includes('token') || 
        errorMessage.toLowerCase().includes('autoriza') ? 'token_error' :
        errorMessage.toLowerCase().includes('teléfono') || 
        errorMessage.toLowerCase().includes('phone') ? 'phone_error' : 
        'general_error';
      
      setResult({
        success: false,
        error: errorMessage,
        errorType
      });
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar el mensaje: " + errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderErrorHelpText = () => {
    if (!result || result.success || !result.errorType) return null;
    
    switch(result.errorType) {
      case 'token_error':
        return (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start">
              <AlertTriangle className="text-amber-500 mr-2 h-5 w-5 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Problema con el token de WhatsApp</h4>
                <p className="text-sm text-amber-700 mt-1">
                  El token podría ser inválido o haber expirado. Intenta actualizar el token en la pestaña de Configuración.
                </p>
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-amber-700 border-amber-300 hover:bg-amber-100"
                    onClick={() => window.open('https://developers.facebook.com/apps/', '_blank')}
                  >
                    Ir a Meta for Developers
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'phone_error':
        return (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start">
              <AlertCircle className="text-blue-500 mr-2 h-5 w-5 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Formato de número incorrecto</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Asegúrate de incluir el código de país completo (ej: +34612345678).
                  Los números deben estar en formato E.164 para WhatsApp Business API.
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex items-start">
              <AlertCircle className="text-gray-500 mr-2 h-5 w-5 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-800">Error de envío</h4>
                <p className="text-sm text-gray-700 mt-1">
                  Verifica la configuración de WhatsApp y asegúrate de que tu cuenta de WhatsApp Business API esté activa.
                </p>
              </div>
            </div>
          </div>
        );
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Probar Mensaje de WhatsApp</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Número de teléfono</Label>
          <Input
            id="phoneNumber"
            placeholder="Ej: +34612345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-sm text-muted-foreground">
            Introduce un número con formato internacional (con el prefijo del país)
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="message">Mensaje</Label>
          <Input
            id="message"
            placeholder="Mensaje de prueba"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Mensaje enviado correctamente</AlertTitle>
                <AlertDescription>
                  ID del mensaje: {result.messageId?.substring(0, 12)}...
                </AlertDescription>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error al enviar el mensaje</AlertTitle>
                <AlertDescription>
                  {result.error}
                </AlertDescription>
              </>
            )}
          </Alert>
        )}
        
        {renderErrorHelpText()}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSend} 
          disabled={isLoading || !phoneNumber}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Enviar mensaje de prueba
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WhatsAppTestMessage;
