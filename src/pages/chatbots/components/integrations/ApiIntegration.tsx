
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2 } from "lucide-react";

interface ApiIntegrationProps {
  chatbotId: string;
}

const ApiIntegration: React.FC<ApiIntegrationProps> = ({ chatbotId }) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Code2 className="h-6 w-6 text-blue-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium">API REST</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Integra este chatbot en tu aplicación utilizando nuestra API REST.
              </p>
            </div>
            
            <Button className="w-full" variant="outline">
              Ver documentación API
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="p-4 bg-muted">
        <h4 className="font-medium mb-2">ID del chatbot</h4>
        <div className="bg-background p-2 rounded border font-mono text-sm overflow-auto">
          {chatbotId}
        </div>
      </Card>
    </div>
  );
};

export default ApiIntegration;
