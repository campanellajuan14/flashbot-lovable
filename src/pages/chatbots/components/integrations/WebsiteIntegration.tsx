
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

interface WebsiteIntegrationProps {
  chatbotId: string;
}

const WebsiteIntegration: React.FC<WebsiteIntegrationProps> = ({ chatbotId }) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center">
              <Globe className="h-6 w-6 text-violet-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Sitio web</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Integra este chatbot en tu sitio web con un simple fragmento de código.
              </p>
            </div>
            
            <Button className="w-full">
              Obtener código
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="p-4">
        <h4 className="font-medium mb-2">Instrucciones</h4>
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          <li>Copia el fragmento de código HTML</li>
          <li>Pégalo justo antes del cierre de la etiqueta &lt;/body&gt; en tu sitio web</li>
          <li>Personaliza la apariencia desde la sección "Compartir"</li>
        </ol>
      </Card>
    </div>
  );
};

export default WebsiteIntegration;
