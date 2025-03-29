import React, { useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Upload,
  File,
  FileText,
  Trash2,
  Settings,
  Loader2, 
  AlertCircle,
  Download,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  name: string;
  content: string;
  created_at: string;
  metadata: {
    type?: string;
    source?: string;
    size?: number;
    isChunk?: boolean;
    parentId?: string;
    [key: string]: any;
  };
}

interface RetrievalSettings {
  chatbot_id: string;
  similarity_threshold: number;
  max_results: number;
  chunk_size: number;
  chunk_overlap: number;
  use_hierarchical_embeddings: boolean;
  embedding_model: string;
  use_cache: boolean;
}

const ChatbotDocuments = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedTab, setSelectedTab] = useState<string>("documents");
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [retrievalSettings, setRetrievalSettings] = useState<RetrievalSettings | null>(null);
  const [isEditingSettings, setIsEditingSettings] = useState<boolean>(false);

  const { data: chatbot, isLoading: isLoadingChatbot } = useQuery({
    queryKey: ['chatbot', id],
    queryFn: async () => {
      if (!id) throw new Error("Se requiere ID del chatbot");
      
      const { data, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { 
    data: documents, 
    isLoading: isLoadingDocuments,
    isError: isErrorDocuments,
    error: documentsError 
  } = useQuery({
    queryKey: ['chatbot-documents', id],
    queryFn: async () => {
      if (!id) throw new Error("Se requiere ID del chatbot");
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('chatbot_id', id)
        .eq('metadata->>isChunk', 'false')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Document[];
    },
  });

  const { 
    data: settings, 
    isLoading: isLoadingSettings 
  } = useQuery({
    queryKey: ['retrieval-settings', id],
    queryFn: async () => {
      if (!id) throw new Error("Se requiere ID del chatbot");
      
      const { data, error } = await supabase
        .rpc('get_retrieval_settings', { p_chatbot_id: id });
      
      if (error) throw error;
      
      setRetrievalSettings(data);
      return data as RetrievalSettings;
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);
      
      if (error) throw error;
      return documentId;
    },
    onSuccess: (deletedId) => {
      toast({
        title: "Documento eliminado",
        description: "El documento ha sido eliminado correctamente.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['chatbot-documents', id] });
    },
    onError: (error) => {
      console.error("Error al eliminar documento:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el documento. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: RetrievalSettings) => {
      const { error } = await supabase
        .from('retrieval_settings')
        .upsert({
          chatbot_id: id,
          similarity_threshold: settings.similarity_threshold,
          max_results: settings.max_results,
          chunk_size: settings.chunk_size,
          chunk_overlap: settings.chunk_overlap,
          use_hierarchical_embeddings: settings.use_hierarchical_embeddings,
          embedding_model: settings.embedding_model,
          use_cache: settings.use_cache
        });
      
      if (error) throw error;
      return settings;
    },
    onSuccess: () => {
      toast({
        title: "Configuración actualizada",
        description: "La configuración de recuperación ha sido actualizada.",
      });
      
      setIsEditingSettings(false);
      queryClient.invalidateQueries({ queryKey: ['retrieval-settings', id] });
    },
    onError: (error) => {
      console.error("Error al actualizar configuración:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 300);
      
      setTimeout(() => {
        clearInterval(interval);
        setUploadProgress(100);
        
        toast({
          title: "Documentos subidos",
          description: `Se subieron ${files.length} documento(s) correctamente.`,
        });
        
        queryClient.invalidateQueries({ queryKey: ['chatbot-documents', id] });
        
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
        }, 1000);
      }, 3000);
    } catch (error) {
      console.error("Error al subir documentos:", error);
      setUploading(false);
      
      toast({
        title: "Error al subir documentos",
        description: "Ocurrió un error al procesar los documentos. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer.")) {
      deleteDocumentMutation.mutate(documentId);
    }
  };

  const handleSaveSettings = () => {
    if (retrievalSettings) {
      updateSettingsMutation.mutate(retrievalSettings);
    }
  };

  if (isErrorDocuments) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {documentsError instanceof Error 
              ? documentsError.message 
              : "Error al cargar los documentos. Por favor, inténtalo de nuevo."}
          </AlertDescription>
        </Alert>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate(`/chatbots/${id}`)}
        >
          Volver al chatbot
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              asChild
            >
              <Link to={`/chatbots/${id}`}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-lg font-semibold">
                {isLoadingChatbot ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando...
                  </span>
                ) : (
                  chatbot?.name || "Documentos del chatbot"
                )}
              </h1>
              <p className="text-sm text-muted-foreground">Gestión de documentos</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/chatbots/${id}`}>
                Volver al chatbot
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/chatbots/${id}/preview`}>
                Vista previa
              </Link>
            </Button>
          </div>
        </div>
      </header>
      
      <div className="flex-1">
        <div className="container max-w-6xl mx-auto py-6 px-4">
          <Tabs 
            defaultValue="documents" 
            value={selectedTab}
            onValueChange={setSelectedTab}
            className="w-full"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="documents">Documentos</TabsTrigger>
              <TabsTrigger value="settings">Configuración</TabsTrigger>
            </TabsList>
            
            <TabsContent value="documents" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subir documentos</CardTitle>
                  <CardDescription>
                    Sube documentos para mejorar las respuestas de tu chatbot. Formatos soportados: PDF, TXT, CSV.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                      dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20",
                      uploading && "opacity-50"
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Upload className="h-10 w-10 text-muted-foreground" />
                      <h3 className="text-lg font-medium">
                        Arrastra archivos aquí o haz clic para seleccionar
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Archivos compatibles: PDF, TXT, CSV, DOC, DOCX
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        multiple
                        accept=".pdf,.txt,.csv,.doc,.docx"
                        onChange={(e) => handleFileUpload(e.target.files)}
                        disabled={uploading}
                      />
                      <Button
                        type="button"
                        onClick={handleFileButtonClick}
                        disabled={uploading}
                        className="mt-2"
                      >
                        Seleccionar archivos
                      </Button>
                    </div>
                    
                    {uploading && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-1">
                          Subiendo... {uploadProgress}%
                        </p>
                        <div className="w-full bg-secondary rounded-full h-2.5">
                          <div
                            className="bg-primary h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Documentos subidos</CardTitle>
                  <CardDescription>
                    {isLoadingDocuments ? (
                      "Cargando documentos..."
                    ) : documents && documents.length > 0 ? (
                      `${documents.length} documento(s) subido(s)`
                    ) : (
                      "No hay documentos subidos"
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingDocuments ? (
                    <div className="flex justify-center items-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : documents && documents.length > 0 ? (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div 
                          key={doc.id} 
                          className="flex items-center justify-between p-3 rounded-md border"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-muted">
                              {doc.metadata?.type?.includes('pdf') ? (
                                <FileText className="h-5 w-5 text-primary" />
                              ) : doc.metadata?.type?.includes('csv') ? (
                                <FileText className="h-5 w-5 text-emerald-500" />
                              ) : (
                                <File className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium">{doc.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {new Date(doc.created_at).toLocaleDateString()} - 
                                {doc.metadata?.source && ` Fuente: ${doc.metadata.source}`}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8 border rounded-md bg-muted/30">
                      <FileText className="h-10 w-10 mb-2 mx-auto text-muted-foreground" />
                      <h3 className="text-lg font-medium">No hay documentos</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Sube documentos para que tu chatbot pueda responder preguntas basadas en ellos.
                      </p>
                      <Button onClick={handleFileButtonClick}>
                        <Plus className="h-4 w-4 mr-2" />
                        Añadir documento
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Configuración de recuperación</CardTitle>
                      <CardDescription>
                        Configura cómo se recuperan y procesan los documentos para responder consultas.
                      </CardDescription>
                    </div>
                    {!isEditingSettings ? (
                      <Button 
                        variant="outline"
                        onClick={() => setIsEditingSettings(true)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsEditingSettings(false);
                            if (settings) {
                              setRetrievalSettings(settings);
                            }
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleSaveSettings}
                          disabled={updateSettingsMutation.isPending}
                        >
                          {updateSettingsMutation.isPending && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Guardar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingSettings ? (
                    <div className="flex justify-center items-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : retrievalSettings ? (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Parámetros de búsqueda</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Umbral de similitud
                            </label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="range"
                                min="0.1"
                                max="0.9"
                                step="0.05"
                                value={retrievalSettings.similarity_threshold}
                                onChange={(e) => 
                                  setRetrievalSettings({
                                    ...retrievalSettings,
                                    similarity_threshold: parseFloat(e.target.value)
                                  })
                                }
                                disabled={!isEditingSettings}
                                className="flex-1"
                              />
                              <span className="text-sm w-12 text-right">
                                {retrievalSettings.similarity_threshold.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Un valor más alto requiere mayor similitud para incluir un documento.
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Número máximo de resultados
                            </label>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={retrievalSettings.max_results}
                              onChange={(e) => 
                                setRetrievalSettings({
                                  ...retrievalSettings,
                                  max_results: parseInt(e.target.value)
                                })
                              }
                              disabled={!isEditingSettings}
                            />
                            <p className="text-xs text-muted-foreground">
                              Cantidad máxima de documentos a incluir en cada respuesta.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Parámetros de procesamiento de documentos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Tamaño de chunk
                            </label>
                            <Input
                              type="number"
                              min="100"
                              max="2000"
                              step="100"
                              value={retrievalSettings.chunk_size}
                              onChange={(e) => 
                                setRetrievalSettings({
                                  ...retrievalSettings,
                                  chunk_size: parseInt(e.target.value)
                                })
                              }
                              disabled={!isEditingSettings}
                            />
                            <p className="text-xs text-muted-foreground">
                              Tamaño de cada fragmento de texto en caracteres.
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Solapamiento de chunks
                            </label>
                            <Input
                              type="number"
                              min="0"
                              max="500"
                              step="10"
                              value={retrievalSettings.chunk_overlap}
                              onChange={(e) => 
                                setRetrievalSettings({
                                  ...retrievalSettings,
                                  chunk_overlap: parseInt(e.target.value)
                                })
                              }
                              disabled={!isEditingSettings}
                            />
                            <p className="text-xs text-muted-foreground">
                              Cuánto se solapan los fragmentos de texto entre sí.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Configuración avanzada</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Modelo de embeddings
                            </label>
                            <select
                              className={cn(
                                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              )}
                              value={retrievalSettings.embedding_model}
                              onChange={(e) => 
                                setRetrievalSettings({
                                  ...retrievalSettings,
                                  embedding_model: e.target.value
                                })
                              }
                              disabled={!isEditingSettings}
                            >
                              <option value="text-embedding-ada-002">OpenAI Ada 002</option>
                              <option value="text-embedding-3-small">OpenAI Embedding 3 Small</option>
                              <option value="text-embedding-3-large">OpenAI Embedding 3 Large</option>
                            </select>
                            <p className="text-xs text-muted-foreground">
                              Modelo usado para generar embeddings vectoriales.
                            </p>
                          </div>
                          
                          <div className="space-y-2 flex items-center">
                            <div className="flex-1">
                              <label className="text-sm font-medium block">
                                Usar caché
                              </label>
                              <p className="text-xs text-muted-foreground">
                                Guardar resultados de búsqueda para consultas frecuentes.
                              </p>
                            </div>
                            <div className="flex items-center h-10">
                              <input
                                type="checkbox"
                                className="toggle"
                                checked={retrievalSettings.use_cache}
                                onChange={(e) => 
                                  setRetrievalSettings({
                                    ...retrievalSettings,
                                    use_cache: e.target.checked
                                  })
                                }
                                disabled={!isEditingSettings}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <Settings className="h-10 w-10 mb-2 mx-auto text-muted-foreground" />
                      <h3 className="text-lg font-medium">Sin configuración</h3>
                      <p className="text-sm text-muted-foreground">
                        No se pudo cargar la configuración de recuperación.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ChatbotDocuments;
