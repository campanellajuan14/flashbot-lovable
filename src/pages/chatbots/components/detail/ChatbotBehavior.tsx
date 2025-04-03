
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ChatbotBehaviorProps {
  chatbot: any;
}

const ChatbotBehavior: React.FC<ChatbotBehaviorProps> = ({ chatbot }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comportamiento</CardTitle>
        <CardDescription>
          Personalidad y comportamiento del chatbot
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Personalidad</h3>
          <p className="text-sm text-muted-foreground">
            {chatbot.behavior?.personality || "No se ha definido una personalidad específica."}
          </p>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-medium">Instrucciones</h3>
          <p className="text-sm text-muted-foreground">
            {chatbot.behavior?.instructions || "No se han definido instrucciones específicas."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatbotBehavior;
