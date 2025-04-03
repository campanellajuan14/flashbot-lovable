
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppMessage {
  id: string;
  wa_message_id?: string;
  from_number: string;
  to_number: string;
  message_content: string;
  message_type: string;
  direction: 'inbound' | 'outbound';
  status?: string;
  timestamp: string;
}

export const WhatsAppMessagesTab = () => {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();
  const messagesPerPage = 10;

  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .rpc('get_whatsapp_messages', {
            page_number: page,
            page_size: messagesPerPage
          });
        
        if (error) {
          console.error("Error fetching messages:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudieron cargar los mensajes de WhatsApp",
          });
          return;
        }
        
        setMessages(data || []);
        setHasMore((data || []).length === messagesPerPage);
      } catch (error) {
        console.error("Error loading messages:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al cargar los mensajes",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessages();
  }, [page, toast, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    // Remove any "+" prefix for consistency
    const formattedNumber = phoneNumber.replace('+', '');
    
    // Return shortened version with first 5 and last 3 digits
    if (formattedNumber.length > 8) {
      return `${formattedNumber.substring(0, 5)}...${formattedNumber.substring(formattedNumber.length - 3)}`;
    }
    return formattedNumber;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const getStatusColor = (status?: string, direction?: 'inbound' | 'outbound') => {
    if (direction === 'inbound') return 'bg-blue-100 text-blue-800';
    
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'read':
        return 'bg-purple-100 text-purple-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status?: string, direction?: 'inbound' | 'outbound') => {
    if (direction === 'inbound') return 'Recibido';
    
    switch (status) {
      case 'sent':
        return 'Enviado';
      case 'delivered':
        return 'Entregado';
      case 'read':
        return 'Leído';
      case 'failed':
        return 'Fallido';
      default:
        return 'Desconocido';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-card border-b px-6">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Mensajes de WhatsApp</CardTitle>
            <CardDescription>
              Historial de mensajes enviados y recibidos
            </CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center p-6 text-muted-foreground">
            No hay mensajes para mostrar
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Mensaje</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>
                      {message.direction === 'inbound' ? 'Recibido' : 'Enviado'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {message.message_content}
                    </TableCell>
                    <TableCell>
                      {message.direction === 'inbound'
                        ? formatPhoneNumber(message.from_number)
                        : formatPhoneNumber(message.to_number)}
                    </TableCell>
                    <TableCell>
                      {formatDate(message.timestamp)}
                    </TableCell>
                    <TableCell>
                      <span 
                        className={`px-2 py-1 rounded-full text-xs ${
                          getStatusColor(message.status, message.direction)
                        }`}
                      >
                        {getStatusText(message.status, message.direction)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center p-4 border-t">
        <div className="text-sm text-muted-foreground">
          {messages.length > 0 
            ? `Mostrando ${messages.length} mensajes` 
            : 'No hay mensajes'}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            // Fix: Replace disabled attribute with conditional rendering
            className={page === 0 ? "opacity-50 cursor-not-allowed" : ""}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setPage(p => p + 1)}
            // Fix: Replace disabled attribute with conditional rendering
            className={!hasMore ? "opacity-50 cursor-not-allowed" : ""}
          >
            Siguiente <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default WhatsAppMessagesTab;
