
import React, { useState } from "react";
import { 
  Button, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Input,
  Separator,
  useToast
} from "@/components/ui";
import { Settings, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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

interface RetrievalSettingsCardProps {
  chatbotId: string;
  settings: RetrievalSettings | null;
  isLoading: boolean;
}

const RetrievalSettingsCard = ({
  chatbotId,
  settings,
  isLoading
}: RetrievalSettingsCardProps) => {
  const [retrievalSettings, setRetrievalSettings] = useState<RetrievalSettings | null>(settings);
  const [isEditingSettings, setIsEditingSettings] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: RetrievalSettings) => {
      const { error } = await supabase
        .from('retrieval_settings')
        .upsert({
          chatbot_id: chatbotId,
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
      queryClient.invalidateQueries({ queryKey: ['retrieval-settings', chatbotId] });
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

  const handleSaveSettings = () => {
    if (retrievalSettings) {
      updateSettingsMutation.mutate(retrievalSettings);
    }
  };

  return (
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
        {isLoading ? (
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
  );
};

export default RetrievalSettingsCard;
