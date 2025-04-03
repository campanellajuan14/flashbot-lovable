
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle, AlertCircle, Send } from "lucide-react";
import { sendWhatsAppTextMessage } from '@/integrations/supabase/whatsappTemplates';

export const WhatsAppTestMessage = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('Mensaje de prueba');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    messageId?: string;
    error?: string;
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
      formattedNumber = '+' + formattedNumber;
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
      
      setResult({
        success: false,
        error: errorMessage
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
