import React, { useEffect, useState } from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppMessage } from '@/integrations/supabase/whatsappTypes';

interface MessagesResponse {
  data: WhatsAppMessage[];
  count: number;
}

const WhatsAppMessagesTab = () => {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .rpc<MessagesResponse>('get_whatsapp_messages', {
            page_number: currentPage,
            page_size: pageSize
          });
        
        if (error) {
          console.error("Error fetching messages:", error);
          return;
        }
        
        if (data) {
          setMessages(data.data || []);
          setTotalCount(data.count || 0);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessages();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No hay mensajes</h3>
            <p className="text-muted-foreground mt-2">
              Aún no tienes mensajes de WhatsApp registrados.
            </p>
          </div>
        ) : (
          <>
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
                      {message.direction === 'inbound' ? (
                        <span className="flex items-center text-blue-500">
                          <ArrowDownLeft className="h-4 w-4 mr-1" />
                          Recibido
                        </span>
                      ) : (
                        <span className="flex items-center text-green-500">
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                          Enviado
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{message.message_content}</TableCell>
                    <TableCell>
                      {message.direction === 'inbound' ? message.from_number : message.to_number}
                    </TableCell>
                    <TableCell>
                      {format(new Date(message.timestamp), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {message.status || (message.direction === 'inbound' ? 'Recibido' : 'Enviado')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {totalCount > pageSize && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                      disabled={currentPage <= 1}
                    />
                  </PaginationItem>
                  
                  {/* Simplified pagination */}
                  <PaginationItem>
                    <PaginationLink>
                      {currentPage} de {Math.ceil(totalCount / pageSize)}
                    </PaginationLink>
                  </PaginationItem>
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => p + 1)} 
                      disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppMessagesTab;
