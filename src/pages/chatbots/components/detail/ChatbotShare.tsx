
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share } from "lucide-react";

interface ChatbotShareProps {
  chatbotId: string;
}

const ChatbotShare: React.FC<ChatbotShareProps> = ({ chatbotId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Compartir</CardTitle>
        <CardDescription>
          Opciones para compartir tu chatbot
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-6 bg-muted rounded-lg border flex flex-col items-center justify-center text-center">
          <h3 className="font-medium text-lg mb-2">Compartir chatbot</h3>
          <p className="text-muted-foreground mb-4">
            Configura cómo se ve y comporta tu chatbot cuando lo compartes con otros.
          </p>
          <Button>
            <Share className="h-4 w-4 mr-2" />
            Configurar opciones de compartir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatbotShare;
