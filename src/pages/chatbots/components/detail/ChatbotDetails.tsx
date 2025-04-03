
import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import ChatbotInformation from "./ChatbotInformation";
import ChatbotSettings from "./ChatbotSettings";
import ChatbotBehavior from "./ChatbotBehavior";
import ChatbotIntegrations from "./ChatbotIntegrations";
import ChatbotShare from "./ChatbotShare";

interface ChatbotDetailsProps {
  chatbot: any;
}

const ChatbotDetails: React.FC<ChatbotDetailsProps> = ({ chatbot }) => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="information" className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="information">Información</TabsTrigger>
          <TabsTrigger value="behavior">Comportamiento</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
          <TabsTrigger value="integrations">Integraciones</TabsTrigger>
          <TabsTrigger value="share">Compartir</TabsTrigger>
        </TabsList>
        
        <Separator className="mb-6" />
        
        <TabsContent value="information">
          <ChatbotInformation chatbot={chatbot} />
        </TabsContent>
        
        <TabsContent value="behavior">
          <ChatbotBehavior chatbot={chatbot} />
        </TabsContent>
        
        <TabsContent value="settings">
          <ChatbotSettings chatbot={chatbot} />
        </TabsContent>
        
        <TabsContent value="integrations">
          <ChatbotIntegrations 
            chatbot={chatbot} 
            chatbotId={chatbot.id} 
          />
        </TabsContent>
        
        <TabsContent value="share">
          <ChatbotShare chatbotId={chatbot.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatbotDetails;
