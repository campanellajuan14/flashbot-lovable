
import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  useToast
} from "@/components/ui";
import { 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import DocumentUploadCard from "@/components/chatbots/documents/DocumentUploadCard";
import DocumentListCard from "@/components/chatbots/documents/DocumentListCard";
import RetrievalSettingsCard from "@/components/chatbots/documents/RetrievalSettingsCard";

// Define types
interface RecordRange {
  start?: number;
  end?: number;
}

interface DocumentMetadata {
  type?: string;
  source?: string;
  size?: number;
  isChunk?: boolean;
  parentId?: string;
  recordId?: string;
  chunkIndex?: number;
  totalChunks?: number;
  recordRange?: RecordRange;
  [key: string]: any;
}

interface Document {
  id: string;
  name: string;
  content: string;
  created_at: string;
  chatbot_id: string;
  metadata: DocumentMetadata;
  user_id?: string;
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

interface Chatbot {
  id: string;
  name: string;
  user_id: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

const ChatbotDocuments = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedTab, setSelectedTab] = useState<string>("documents");
  const navigate = useNavigate();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const chatbotId = id || '';
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(chatbotId);

  console.log("Current chatbotId:", chatbotId, "Is valid UUID:", isValidUUID);

  const { 
    data: chatbot, 
    isLoading: isLoadingChatbot, 
    error: chatbotError,
    isError: isChatbotError
  } = useQuery({
    queryKey: ['chatbot', chatbotId],
    queryFn: async () => {
      if (!chatbotId || !isValidUUID) {
        console.error("Invalid chatbot ID format:", chatbotId);
        throw new Error("ID de chatbot inválido o no proporcionado");
      }
      
      console.log("Fetching chatbot with ID:", chatbotId);
      const { data, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('id', chatbotId)
        .single();
      
      if (error) {
        console.error("Error fetching chatbot:", error);
        throw error;
      }
      
      if (!data) {
        console.error("No chatbot found with ID:", chatbotId);
        throw new Error("Chatbot no encontrado");
      }
      
      console.log("Chatbot data retrieved:", data);
      return data as Chatbot;
    },
    retry: 1,
    enabled: isValidUUID,
  });

  const { 
    data: documents, 
    isLoading: isLoadingDocuments,
    isError: isErrorDocuments,
    error: documentsError,
    refetch: refetchDocuments
  } = useQuery({
    queryKey: ['chatbot-documents', chatbotId],
    queryFn: async () => {
      if (!chatbotId || !isValidUUID) {
        console.error("Invalid chatbot ID for documents:", chatbotId);
        throw new Error("ID de chatbot inválido o no proporcionado");
      }
      
      console.log("Fetching documents for chatbot:", chatbotId);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .eq('metadata->isChunk', 'false')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching documents:", error);
        throw error;
      }
      
      console.log("Documents retrieved:", data?.length || 0);
      return data as Document[];
    },
    enabled: isValidUUID && !!chatbot,
    retry: 1
  });

  const { 
    data: settings, 
    isLoading: isLoadingSettings,
    error: settingsError,
    refetch: refetchSettings
  } = useQuery({
    queryKey: ['retrieval-settings', chatbotId],
    queryFn: async () => {
      if (!chatbotId || !isValidUUID) {
        throw new Error("ID de chatbot inválido o no proporcionado");
      }
      
      const { data, error } = await supabase
        .rpc('get_retrieval_settings', { p_chatbot_id: chatbotId });
      
      if (error) {
        console.error("Error al cargar configuración:", error);
        throw error;
      }
      
      return data as RetrievalSettings;
    },
    enabled: isValidUUID,
  });

  const handleUploadClick = () => {
    setSelectedTab("documents");
    fileInputRef.current?.click();
  };

  if (!isValidUUID) {
    console.error("Invalid UUID format:", chatbotId);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            ID de chatbot inválido o no proporcionado. Por favor, verifica la URL.
          </AlertDescription>
        </Alert>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate(`/chatbots`)}
        >
          Volver a mis chatbots
        </Button>
      </div>
    );
  }

  if (isChatbotError) {
    const errorMessage = (chatbotError as Error)?.message || "Error al cargar el chatbot";
    console.error("Chatbot error:", errorMessage);
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={() => navigate(`/chatbots`)}>
            Volver a mis chatbots
          </Button>
        </div>
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
              <Link to={`/chatbots/${chatbotId}`}>
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
              <Link to={`/chatbots/${chatbotId}`}>
                Volver al chatbot
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/chatbots/${chatbotId}/preview`}>
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
              {chatbot && (
                <DocumentUploadCard 
                  chatbotId={chatbotId} 
                  userId={chatbot.user_id}
                  retrievalSettings={settings}
                  onUploadComplete={refetchDocuments}
                />
              )}
              
              <DocumentListCard 
                chatbotId={chatbotId}
                documents={documents}
                isLoading={isLoadingDocuments}
                onUploadClick={handleUploadClick}
              />
            </TabsContent>
            
            <TabsContent value="settings">
              <RetrievalSettingsCard 
                chatbotId={chatbotId}
                settings={settings}
                isLoading={isLoadingSettings}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ChatbotDocuments;
