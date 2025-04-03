
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ChatbotSettingsProps {
  chatbot: any;
}

const ChatbotSettings: React.FC<ChatbotSettingsProps> = ({ chatbot }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración</CardTitle>
        <CardDescription>
          Ajustes generales del chatbot
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Estado</h3>
          <p className="text-sm text-muted-foreground">
            El chatbot está actualmente {chatbot.is_active ? "activo" : "inactivo"}.
          </p>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-medium">Configuración avanzada</h3>
          <p className="text-sm text-muted-foreground">
            Para modificar la configuración avanzada, edite el chatbot.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatbotSettings;
