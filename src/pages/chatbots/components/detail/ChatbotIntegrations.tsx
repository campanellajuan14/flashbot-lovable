
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import WhatsAppIntegration from "../integrations/WhatsAppIntegration";
import ApiIntegration from "../integrations/ApiIntegration";
import WebsiteIntegration from "../integrations/WebsiteIntegration";

interface ChatbotIntegrationsProps {
  chatbot: any;
  chatbotId: string;
}

const ChatbotIntegrations: React.FC<ChatbotIntegrationsProps> = ({ chatbot, chatbotId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Integraciones</CardTitle>
        <CardDescription>
          Conecta tu chatbot con diferentes plataformas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="website" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="website">Sitio Web</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          </TabsList>

          <TabsContent value="website">
            <WebsiteIntegration chatbotId={chatbotId} />
          </TabsContent>

          <TabsContent value="api">
            <ApiIntegration chatbotId={chatbotId} />
          </TabsContent>

          <TabsContent value="whatsapp">
            <WhatsAppIntegration chatbotId={chatbotId} chatbot={chatbot} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ChatbotIntegrations;
