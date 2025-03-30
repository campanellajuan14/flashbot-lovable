
import React from "react";
import { Conversation } from "@/hooks/useConversationsData";
import { Chatbot } from "@/pages/chatbots/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { formatDistance } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface ConversationsTableProps {
  conversations: Conversation[];
  isLoading: boolean;
  chatbots: Chatbot[];
}

const ConversationsTable: React.FC<ConversationsTableProps> = ({
  conversations,
  isLoading,
  chatbots
}) => {
  const navigate = useNavigate();

  // Helper to format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistance(date, new Date(), { 
      addSuffix: true,
      locale: es
    });
  };

  // Helper to get chatbot name
  const getChatbotName = (chatbotId: string) => {
    const chatbot = chatbots.find(c => c.id === chatbotId);
    return chatbot ? chatbot.name : "Desconocido";
  };

  // Handle click to view conversation details
  const handleViewConversation = (conversationId: string) => {
    navigate(`/conversations/${conversationId}`);
  };
  
  // Generate a color for badge based on chatbot ID
  const getColorForChatbot = (chatbotId: string) => {
    const colors = ["default", "secondary", "destructive", "outline"];
    const index = chatbotId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Chatbot</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Fecha de inicio</TableHead>
            <TableHead>Última actualización</TableHead>
            <TableHead>Mensajes</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conversations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                No se encontraron conversaciones
              </TableCell>
            </TableRow>
          ) : (
            conversations.map((conversation) => (
              <TableRow key={conversation.id}>
                <TableCell>
                  <Badge variant={getColorForChatbot(conversation.chatbot_id) as any}>
                    {getChatbotName(conversation.chatbot_id)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {conversation.user_identifier || "Anónimo"}
                </TableCell>
                <TableCell>{formatDate(conversation.created_at)}</TableCell>
                <TableCell>{formatDate(conversation.updated_at)}</TableCell>
                <TableCell>{conversation.message_count || 0}</TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewConversation(conversation.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ConversationsTable;
