
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MessageSquare, Plus, Search, MoreHorizontal, Copy, Edit, Trash, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

// Define a type for our chatbot data
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

const ChatbotList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch chatbots from Supabase
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

  // Function to copy chatbot ID
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

  // Function to delete a chatbot
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
        
        // Refetch chatbots to update the list
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
  
  // Filter chatbots based on search query
  const filteredChatbots = chatbots?.filter(chatbot => 
    chatbot.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (chatbot.description && chatbot.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  // Calculate conversation count from Supabase
  const getConversationCount = async (chatbotId: string) => {
    try {
      const { count, error } = await supabase
        .from('conversations')
        .select('id', { count: 'exact' })
        .eq('chatbot_id', chatbotId);
      
      if (error) throw error;
      return count || 0;
    } catch (err) {
      console.error("Error al contar conversaciones:", err);
      return 0;
    }
  };

  // Debugging logs
  useEffect(() => {
    console.log("Current user:", user);
    console.log("Is loading:", isLoading);
    console.log("Current chatbots:", chatbots);
  }, [user, isLoading, chatbots]);

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

        {isLoading ? (
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredChatbots.map((chatbot) => (
                <Card key={chatbot.id} className="dashboard-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={chatbot.is_active ? "default" : "secondary"}>
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
                    <CardTitle className="text-xl">{chatbot.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {chatbot.description || "Sin descripción"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Conversaciones</p>
                        <p className="font-medium">{0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Creado</p>
                        <p className="font-medium">{new Date(chatbot.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
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
            
            {filteredChatbots.length === 0 && (
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
