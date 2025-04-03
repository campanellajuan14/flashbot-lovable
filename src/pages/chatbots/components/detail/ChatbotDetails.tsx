
import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ChatbotInformation from "./ChatbotInformation";
import ChatbotConfiguration from "./ChatbotConfiguration";
import ChatbotWhatsAppSettings from "@/components/whatsapp/ChatbotWhatsAppSettings";
import { Chatbot } from "../../types";

interface ChatbotDetailsProps {
  chatbot: Chatbot;
}

const ChatbotDetails = ({ chatbot }: ChatbotDetailsProps) => {
  return (
    <Tabs defaultValue="info" className="w-full">
      <TabsList className="grid grid-cols-3 mb-4">
        <TabsTrigger value="info">Información</TabsTrigger>
        <TabsTrigger value="config">Configuración</TabsTrigger>
        <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
      </TabsList>

      <TabsContent value="info" className="space-y-4">
        <ChatbotInformation 
          chatbot={chatbot} 
          onDelete={() => {}} // Agregamos esta prop que faltaba
        />
      </TabsContent>

      <TabsContent value="config" className="space-y-4">
        <ChatbotConfiguration 
          chatbot={chatbot}
          chatbotId={chatbot.id} // Agregamos esta prop que faltaba
        />
      </TabsContent>
      
      <TabsContent value="whatsapp" className="space-y-4">
        <ChatbotWhatsAppSettings chatbotId={chatbot.id} />
      </TabsContent>
    </Tabs>
  );
};

export default ChatbotDetails;
