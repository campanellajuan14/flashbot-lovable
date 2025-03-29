
import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Settings, Edit, Trash2, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ChatbotDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch chatbot data
  const {
    data: chatbot,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["chatbot", id],
    queryFn: async () => {
      if (!id) throw new Error("Se requiere ID del chatbot");

      const { data, error } = await supabase
        .from("chatbots")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Delete chatbot mutation
  const deleteChatbotMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Se requiere ID del chatbot");

      const { error } = await supabase.from("chatbots").delete().eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Chatbot eliminado",
        description: "El chatbot ha sido eliminado correctamente.",
      });
      navigate("/chatbots");
    },
    onError: (error) => {
      console.error("Error al eliminar chatbot:", error);
      toast({
        title: "Error",
        description:
          "No se pudo eliminar el chatbot. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async () => {
      if (!id || !chatbot) throw new Error("Se requiere chatbot");

      const { error } = await supabase
        .from("chatbots")
        .update({ is_active: !chatbot.is_active })
        .eq("id", id);

      if (error) throw error;
      return !chatbot.is_active;
    },
    onSuccess: (newActiveState) => {
      toast({
        title: newActiveState
          ? "Chatbot activado"
          : "Chatbot desactivado",
        description: newActiveState
          ? "El chatbot ha sido activado correctamente."
          : "El chatbot ha sido desactivado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["chatbot", id] });
    },
    onError: (error) => {
      console.error("Error al cambiar estado del chatbot:", error);
      toast({
        title: "Error",
        description:
          "No se pudo cambiar el estado del chatbot. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteChatbot = () => {
    deleteChatbotMutation.mutate();
    setShowDeleteDialog(false);
  };

  const handleToggleActive = () => {
    toggleActiveMutation.mutate();
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Render error state
  if (isError || !chatbot) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Ocurrió un error al cargar el chatbot"}
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/chatbots")}>Volver a Chatbots</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/chatbots">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{chatbot.name}</h1>
              <p className="text-sm text-muted-foreground">
                Detalles del chatbot
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleActive}
              disabled={toggleActiveMutation.isPending}
            >
              {toggleActiveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {chatbot.is_active ? "Desactivar" : "Activar"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link to={`/chatbots/${id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
            <Button
              variant="default"
              size="sm"
              asChild
            >
              <Link to={`/chatbots/${id}/preview`}>
                <Play className="h-4 w-4 mr-2" />
                Vista Previa
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4">
        <div className="container max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Columna izquierda */}
            <div className="col-span-1 space-y-6">
              {/* Tarjeta principal */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {chatbot.name}
                        {chatbot.is_active ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50">
                            Inactivo
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {chatbot.description || "Sin descripción"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">Personalidad</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Tono:</span>{" "}
                          {chatbot.behavior?.tone || "No especificado"}
                        </div>
                        <div>
                          <span className="font-medium">Estilo:</span>{" "}
                          {chatbot.behavior?.style || "No especificado"}
                        </div>
                        <div>
                          <span className="font-medium">Idioma:</span>{" "}
                          {chatbot.behavior?.language === "es"
                            ? "Español"
                            : chatbot.behavior?.language === "en"
                            ? "Inglés"
                            : chatbot.behavior?.language || "No especificado"}
                        </div>
                        <div>
                          <span className="font-medium">Emojis:</span>{" "}
                          {chatbot.behavior?.useEmojis ? "Sí" : "No"}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-sm font-medium mb-1">
                        Comportamiento
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Hace preguntas:</span>{" "}
                          {chatbot.behavior?.askQuestions ? "Sí" : "No"}
                        </div>
                        <div>
                          <span className="font-medium">
                            Sugiere soluciones:
                          </span>{" "}
                          {chatbot.behavior?.suggestSolutions ? "Sí" : "No"}
                        </div>
                      </div>
                    </div>

                    {chatbot.behavior?.instructions && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="text-sm font-medium mb-1">
                            Instrucciones personalizadas
                          </h3>
                          <div className="text-sm bg-muted p-2 rounded">
                            {chatbot.behavior.instructions}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/chatbots/${id}/documents`}>
                      <FileText className="h-4 w-4 mr-2" />
                      Gestionar documentos
                    </Link>
                  </Button>
                  <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>¿Eliminar chatbot?</DialogTitle>
                        <DialogDescription>
                          Esta acción eliminará permanentemente el chatbot {chatbot.name} y no se puede deshacer.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowDeleteDialog(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteChatbot}
                          disabled={deleteChatbotMutation.isPending}
                        >
                          {deleteChatbotMutation.isPending && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Eliminar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            </div>

            {/* Columna derecha */}
            <div className="col-span-1 md:col-span-2 space-y-6">
              {/* Configuración del modelo */}
              <Card>
                <CardHeader>
                  <CardTitle>Configuración del modelo</CardTitle>
                  <CardDescription>
                    Configuración técnica del modelo de IA
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium mb-1">Modelo</h3>
                        <div className="text-sm">
                          {chatbot.settings?.model || "claude-3-haiku-20240307"}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-1">
                          Temperatura
                        </h3>
                        <div className="text-sm">
                          {chatbot.settings?.temperature || "0.7"}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-1">
                          Tokens máximos
                        </h3>
                        <div className="text-sm">
                          {chatbot.settings?.maxTokens || "1000"}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Estadísticas (a implementar en el futuro) */}
              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas de uso</CardTitle>
                  <CardDescription>
                    Métricas de uso del chatbot
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-6 text-muted-foreground">
                    <p>Las estadísticas estarán disponibles pronto</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotDetail;
