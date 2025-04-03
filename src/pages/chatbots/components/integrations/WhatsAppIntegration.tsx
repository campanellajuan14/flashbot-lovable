
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface WhatsAppIntegrationProps {
  chatbotId: string;
  chatbot: any;
}

const WhatsAppIntegration: React.FC<WhatsAppIntegrationProps> = ({ chatbotId, chatbot }) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium">WhatsApp Business API</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Conecta este chatbot con tu cuenta de WhatsApp Business API para responder mensajes automáticamente.
              </p>
            </div>
            
            <Button className="w-full">
              Configurar WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-sm text-muted-foreground">
        Para usar esta integración necesitas tener configurada una cuenta de WhatsApp Business API.
        Dirígete a Configuración &gt; WhatsApp para completar la configuración.
      </p>
    </div>
  );
};

export default WhatsAppIntegration;
