
import React from "react";
import { Conversation } from "@/hooks/useConversationsData";
import { Chatbot } from "@/pages/chatbots/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, CalendarDays, User, MessageCircle } from "lucide-react";

interface ConversationHeaderProps {
  conversation: Conversation;
  chatbot: Chatbot;
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  conversation,
  chatbot
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {chatbot.name}
          </CardTitle>
          <Badge variant="outline">
            {conversation.message_count || 0} mensajes
          </Badge>
        </div>
        <CardDescription>
          Conversación iniciada el {format(new Date(conversation.created_at), "d 'de' MMMM, yyyy", { locale: es })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Usuario: {conversation.user_identifier || "Anónimo"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Última actualización: {format(new Date(conversation.updated_at), "dd/MM/yyyy HH:mm", { locale: es })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Tipo: {chatbot.description || "Chatbot estándar"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversationHeader;
