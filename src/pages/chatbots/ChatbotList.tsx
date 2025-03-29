
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MessageSquare, Plus, Search, MoreHorizontal, Copy, Edit, Trash, ExternalLink, Loader2, FileText, Cpu, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Chatbot {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  user_id: string;
  settings: Record<string, any>;
  behavior: Record<string, any>;
}

interface ChatbotWithDocuments extends Chatbot {
  documentCount: number;
}

const ChatbotList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: chatbots, isLoading, isError, refetch } = useQuery({
    queryKey: ['chatbots', user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Usuario no autenticado");
      
      console.log("Fetching chatbots for user:", user.id);
      
      const { data, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error("Error fetching chatbots:", error);
        throw error;
      }
      
      console.log("Fetched chatbots:", data);
      return data as Chatbot[];
    },
    enabled: !!user,
  });

  const { data: chatbotsWithDocuments, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['chatbots-with-documents', chatbots],
    queryFn: async () => {
      if (!chatbots || chatbots.length === 0) return [];
      
      const enhancedChatbots: ChatbotWithDocuments[] = await Promise.all(
        chatbots.map(async (chatbot) => {
          const { count, error } = await supabase
            .from('documents')
            .select('id', { count: 'exact' })
            .eq('chatbot_id', chatbot.id);
          
          return {
            ...chatbot,
            documentCount: count || 0
          };
        })
      );
      
      return enhancedChatbots;
    },
    enabled: !!chatbots && chatbots.length > 0,
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado al portapapeles",
        description: "ID del chatbot copiado a tu portapapeles",
      });
    } catch (err) {
      console.error("Falló la copia: ", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este chatbot?")) {
      try {
        const { error } = await supabase
          .from('chatbots')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        toast({
          title: "Chatbot eliminado",
          description: "El chatbot ha sido eliminado con éxito",
        });
        
        refetch();
      } catch (err) {
        console.error("Error al eliminar chatbot:", err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo eliminar el chatbot",
        });
      }
    }
  };

  const filteredChatbots = chatbotsWithDocuments?.filter(chatbot => 
    chatbot.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (chatbot.description && chatbot.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  // Helper function to get AI model name in a user-friendly format
  const getModelName = (chatbot: Chatbot) => {
    const model = chatbot.settings?.model || 'claude-3-haiku-20240307';
    
    if (model.includes('claude-3-haiku')) return 'Claude 3 Haiku';
    if (model.includes('claude-3-sonnet')) return 'Claude 3 Sonnet';
    if (model.includes('claude-3-opus')) return 'Claude 3 Opus';
    if (model.includes('gpt-4')) return 'GPT-4';
    if (model.includes('gpt-3.5')) return 'GPT-3.5';
    
    return model.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Get model badge color based on model name
  const getModelBadgeColor = (modelName: string) => {
    if (modelName.includes('Claude 3 Haiku')) return 'bg-violet-100 text-violet-800 hover:bg-violet-100';
    if (modelName.includes('Claude 3 Sonnet')) return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
    if (modelName.includes('Claude 3 Opus')) return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100';
    if (modelName.includes('GPT-4')) return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100';
    if (modelName.includes('GPT-3.5')) return 'bg-green-100 text-green-800 hover:bg-green-100';
    return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  };

  useEffect(() => {
    console.log("Current user:", user);
    console.log("Is loading:", isLoading);
    console.log("Current chatbots:", chatbots);
    console.log("Chatbots with documents:", chatbotsWithDocuments);
  }, [user, isLoading, chatbots, chatbotsWithDocuments]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tus Chatbots</h1>
            <p className="text-muted-foreground">
              Administra y monitorea todos tus chatbots en un solo lugar
            </p>
          </div>
          <Button asChild>
            <Link to="/chatbots/new">
              <Plus className="mr-2 h-4 w-4" />
              Crear Chatbot
            </Link>
          </Button>
        </div>

        <div className="w-full max-w-md">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar chatbots..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading || isLoadingDocuments ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="text-center py-8">
            <div className="text-destructive mb-2">Error al cargar chatbots</div>
            <Button onClick={() => refetch()}>Intentar de nuevo</Button>
          </div>
        ) : (
          <>
            {filteredChatbots.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredChatbots.map((chatbot) => (
                  <Card key={chatbot.id} className="dashboard-card overflow-hidden transition-all duration-200 hover:shadow-md">
                    <CardHeader className="pb-2 relative">
                      <div className="flex items-center justify-between">
                        <Badge variant={chatbot.is_active ? "default" : "secondary"} className="mb-2">
                          {chatbot.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Menú</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/chatbots/${chatbot.id}`} className="flex w-full cursor-pointer">
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/chatbots/${chatbot.id}/preview`} className="flex w-full cursor-pointer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Vista previa
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="flex cursor-pointer"
                              onClick={() => copyToClipboard(chatbot.id)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copiar ID
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="flex cursor-pointer text-destructive focus:text-destructive"
                              onClick={() => handleDelete(chatbot.id)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl">{chatbot.name}</CardTitle>
                      </div>
                      <CardDescription className="line-clamp-2 mt-1">
                        {chatbot.description || "Sin descripción"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className={getModelBadgeColor(getModelName(chatbot))}>
                                <Cpu className="mr-1 h-3 w-3" />
                                {getModelName(chatbot)}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Modelo de IA</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className={
                                chatbot.documentCount > 0 
                                  ? "bg-blue-100 text-blue-800 hover:bg-blue-100" 
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                              }>
                                <FileText className="mr-1 h-3 w-3" />
                                {chatbot.documentCount} documento{chatbot.documentCount !== 1 ? 's' : ''}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{chatbot.documentCount > 0 ? "Documentos conectados" : "Sin documentos"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Conversaciones</p>
                          <p className="font-medium">{0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Idioma</p>
                          <p className="font-medium">
                            {chatbot.behavior?.language === 'es' ? 'Español' : 
                             chatbot.behavior?.language === 'en' ? 'Inglés' : 
                             chatbot.behavior?.language || 'No definido'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-0">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/chatbots/${chatbot.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link to={`/chatbots/${chatbot.id}/preview`}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Probar
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-semibold">No se encontraron chatbots</h3>
                <p className="mt-2 text-muted-foreground">
                  {searchQuery ? "Intenta con otro término de búsqueda" : "Crea tu primer chatbot para comenzar"}
                </p>
                <Button className="mt-4" asChild>
                  <Link to="/chatbots/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Chatbot
                  </Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ChatbotList;
