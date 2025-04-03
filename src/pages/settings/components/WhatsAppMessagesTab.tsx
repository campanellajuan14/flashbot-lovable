
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ArrowDown, 
  ArrowUp, 
  Loader2, 
  MessageSquare,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';

interface WhatsAppMessage {
  id: string;
  from_number: string;
  to_number: string;
  message_content: string;
  direction: 'inbound' | 'outbound';
  status: string | null;
  timestamp: string;
  message_type: string;
}

export const WhatsAppMessagesTab = () => {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ['whatsapp-messages', page],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('whatsapp_messages')
        .select('*', { count: 'exact' })
        .order('timestamp', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        messages: data as WhatsAppMessage[],
        count: count || 0
      };
    }
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md border border-destructive/30 text-destructive">
        <p className="font-medium">Error al cargar los mensajes</p>
        <p className="text-sm">{(error as Error).message}</p>
      </div>
    );
  }

  if (!data?.messages.length) {
    return (
      <div className="bg-muted/30 border rounded-lg p-8 flex flex-col items-center justify-center text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No hay mensajes de WhatsApp</h3>
        <p className="text-muted-foreground mt-2">
          Los mensajes enviados y recibidos a través de WhatsApp aparecerán aquí.
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil((data?.count || 0) / pageSize);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dirección</TableHead>
              <TableHead>De</TableHead>
              <TableHead>Para</TableHead>
              <TableHead className="hidden md:table-cell">Mensaje</TableHead>
              <TableHead className="hidden md:table-cell">Tipo</TableHead>
              <TableHead className="hidden md:table-cell">Estado</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.messages.map((msg) => (
              <TableRow key={msg.id}>
                <TableCell>
                  {msg.direction === 'inbound' ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <ArrowDown className="h-3 w-3 mr-1" />
                      Entrada
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      Salida
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {formatPhone(msg.from_number)}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {formatPhone(msg.to_number)}
                </TableCell>
                <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                  {msg.message_content}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="secondary" className="text-xs px-1">
                    {msg.message_type}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {renderStatus(msg.status)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate(msg.timestamp)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => page > 1 && handlePageChange(page - 1)}
                className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Lógica para mostrar páginas cercanas a la actual
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink 
                    isActive={pageNum === page}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => page < totalPages && handlePageChange(page + 1)}
                className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

// Funciones auxiliares
const formatPhone = (phone: string) => {
  if (!phone) return '-';
  return phone.length > 10 ? `${phone.slice(0, 5)}...${phone.slice(-4)}` : phone;
};

const formatDate = (timestamp: string) => {
  try {
    return format(new Date(timestamp), "dd MMM yyyy HH:mm", { locale: es });
  } catch (e) {
    return timestamp;
  }
};

const renderStatus = (status: string | null) => {
  if (!status) return '-';
  
  switch (status) {
    case 'sent':
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Enviado
        </Badge>
      );
    case 'delivered':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Entregado
        </Badge>
      );
    case 'read':
      return (
        <Badge className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Leído
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Fallido
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">{status}</Badge>
      );
  }
};

export default WhatsAppMessagesTab;
