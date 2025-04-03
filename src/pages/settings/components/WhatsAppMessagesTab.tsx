
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppMessage } from '@/integrations/supabase/whatsappTypes';

type Direction = 'inbound' | 'outbound' | 'all';

export const WhatsAppMessagesTab = () => {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [direction, setDirection] = useState<Direction>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const pageSize = 10;
  const { toast } = useToast();

  // Load messages from Supabase
  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.rpc('get_whatsapp_messages', {
        page_number: page,
        page_size: pageSize
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

      if (data && data.data) {
        setMessages(data.data);
        setTotalPages(Math.ceil((data.count || 0) / pageSize));
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al cargar los mensajes",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and refresh on page change
  useEffect(() => {
    fetchMessages();
  }, [page]);

  // Setup auto-refresh
  useEffect(() => {
    let intervalId: number | undefined;
    
    if (autoRefresh) {
      intervalId = setInterval(fetchMessages, 10000) as unknown as number;
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, page]);

  // Filter messages by direction
  const filteredMessages = direction === 'all' 
    ? messages 
    : messages.filter(msg => msg.direction === direction);

  // Handle page navigation
  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Toggle auto refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
    if (!autoRefresh) {
      // Refresh immediately when turning on
      fetchMessages();
    }
  };

  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    return phone.length > 8 ? `+${phone}` : phone;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Select 
            value={direction} 
            onValueChange={(value) => setDirection(value as Direction)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Dirección" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los mensajes</SelectItem>
              <SelectItem value="inbound">Mensajes entrantes</SelectItem>
              <SelectItem value="outbound">Mensajes salientes</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={fetchMessages}
            disabled={isLoading}
            title="Actualizar mensajes"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Actualización automática:
          </span>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={toggleAutoRefresh}
            className="h-8"
          >
            {autoRefresh ? "Activada" : "Desactivada"}
          </Button>
        </div>
      </div>
      
      {isLoading && messages.length === 0 ? (
        <div className="py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredMessages.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-10 text-center">
          <p className="text-lg font-medium mb-2">No hay mensajes {direction !== 'all' ? (direction === 'inbound' ? 'recibidos' : 'enviados') : ''}</p>
          <p className="text-muted-foreground max-w-md">
            {direction === 'all' 
              ? 'Aún no hay mensajes de WhatsApp. Verifica que la integración esté correctamente configurada.' 
              : `Aún no hay mensajes ${direction === 'inbound' ? 'recibidos' : 'enviados'} de WhatsApp.`}
          </p>
        </Card>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hora</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>De</TableHead>
                <TableHead>Para</TableHead>
                <TableHead>Mensaje</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMessages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell className="font-mono text-xs whitespace-nowrap">
                    {message.timestamp ? format(parseISO(message.timestamp), 'dd/MM/yy HH:mm:ss') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      message.direction === 'inbound' 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'bg-green-50 text-green-700'
                    }`}>
                      {message.direction === 'inbound' ? 'Entrada' : 'Salida'}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate font-mono text-xs">
                    {formatPhoneNumber(message.from_number)}
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate font-mono text-xs">
                    {formatPhoneNumber(message.to_number)}
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <div className="truncate">
                      {message.message_content || <em className="text-muted-foreground">Sin contenido</em>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {message.status ? (
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        message.status === 'sent' || message.status === 'delivered'
                          ? 'bg-green-50 text-green-700'
                          : message.status === 'failed'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-gray-50 text-gray-700'
                      }`}>
                        {message.status}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page - 1)}
                disabled={page === 1 || isLoading}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages || isLoading}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WhatsAppMessagesTab;
