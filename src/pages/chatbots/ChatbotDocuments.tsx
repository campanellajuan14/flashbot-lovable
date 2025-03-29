
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Settings, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import DocumentUploadCard from "@/components/chatbots/documents/DocumentUploadCard";
import DocumentListCard from "@/components/chatbots/documents/DocumentListCard";
import RetrievalSettingsCard from "@/components/chatbots/documents/RetrievalSettingsCard";

// Define the types explicitly without circular references
interface DocumentMetadata {
  type?: string;
  source?: string;
  size?: number;
  isChunk?: boolean;
  parentId?: string;
  recordId?: string;
  chunkIndex?: number;
  totalChunks?: number;
  recordRange?: {
    start?: number;
    end?: number;
  };
  [key: string]: any;
}

// Export the Document interface so it can be imported elsewhere
export interface Document {
  id: string;
  name: string;
  content: string;
  created_at: string;
  chatbot_id: string;
  metadata: DocumentMetadata;
  user_id?: string;
}

interface Chatbot {
  id: string;
  name: string;
  user_id: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// This type is defined explicitly without self-references to avoid the infinite type instantiation
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const chatbotId = id || "";
  
  // Fetch chatbot data
  const {
    data: chatbot,
    isLoading: isChatbotLoading,
    isError: isChatbotError,
  } = useQuery({
    queryKey: ["chatbot", chatbotId],
    queryFn: async () => {
      if (!chatbotId) throw new Error("Invalid chatbot ID");
      
      console.log("Fetching chatbot with ID:", chatbotId);
      
      const { data, error } = await supabase
        .from("chatbots")
        .select("*")
        .eq("id", chatbotId)
        .single();
      
      if (error) {
        console.error("Error fetching chatbot:", error);
        throw error;
      }
      
      console.log("Chatbot data retrieved:", data);
      return data as Chatbot;
    },
    enabled: !!chatbotId && !!user,
  });
  
  // Fetch documents for this chatbot
  const {
    data: documents,
    isLoading: isDocumentsLoading,
    isError: isDocumentsError,
  } = useQuery({
    queryKey: ["chatbot-documents", chatbotId],
    queryFn: async () => {
      if (!chatbotId) throw new Error("Invalid chatbot ID");
      
      console.log("Fetching documents for chatbot:", chatbotId);
      
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("chatbot_id", chatbotId)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching documents:", error);
        throw error;
      }
      
      console.log("Documents retrieved:", data.length);
      return data as Document[];
    },
    enabled: !!chatbotId && !!user,
  });
  
  // Fetch retrieval settings for this chatbot
  const {
    data: retrievalSettings,
    isLoading: isSettingsLoading,
    isError: isSettingsError,
  } = useQuery({
    queryKey: ["retrieval-settings", chatbotId],
    queryFn: async () => {
      if (!chatbotId) throw new Error("Invalid chatbot ID");
      
      const { data, error } = await supabase
        .from("retrieval_settings")
        .select("*")
        .eq("chatbot_id", chatbotId)
        .single();
      
      if (error) {
        if (error.code === "PGRST116") {
          // No settings found, create default settings
          const defaultSettings: RetrievalSettings = {
            chatbot_id: chatbotId,
            similarity_threshold: 0.7,
            max_results: 3,
            chunk_size: 1000,
            chunk_overlap: 200,
            use_hierarchical_embeddings: false,
            embedding_model: "text-embedding-ada-002",
            use_cache: true,
          };
          
          // Insert default settings
          const { data: newSettings, error: insertError } = await supabase
            .from("retrieval_settings")
            .insert(defaultSettings)
            .select()
            .single();
          
          if (insertError) {
            console.error("Error creating default settings:", insertError);
            throw insertError;
          }
          
          return newSettings as RetrievalSettings;
        }
        
        console.error("Error fetching retrieval settings:", error);
        throw error;
      }
      
      return data as RetrievalSettings;
    },
    enabled: !!chatbotId && !!user,
  });
  
  const handleDocumentUploadComplete = () => {
    // Refresh documents list after upload
    queryClient.invalidateQueries({ queryKey: ["chatbot-documents", chatbotId] });
    
    toast({
      title: "Documents processed",
      description: "Documents have been successfully processed.",
    });
  };
  
  if (isChatbotLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          Loading...
        </div>
      </DashboardLayout>
    );
  }
  
  if (isChatbotError || !chatbot) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center gap-4 p-8">
          <h1 className="text-2xl font-bold">Chatbot not found</h1>
          <p className="text-muted-foreground">
            We couldn't find the requested chatbot.
          </p>
          <Button onClick={() => navigate("/chatbots")}>
            Back to Chatbots
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/chatbots/${chatbotId}`)}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {chatbot.name} - Documents
              </h1>
              <p className="text-muted-foreground">
                Manage documents and retrieval settings for your chatbot
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/chatbots/${chatbotId}/preview`}>
                <FileText className="h-4 w-4 mr-2" />
                Preview
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/chatbots/${chatbotId}`}>
                <Settings className="h-4 w-4 mr-2" />
                Configuration
              </Link>
            </Button>
          </div>
        </div>
        
        <Separator />
        
        <Tabs defaultValue="documents">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="settings">Retrieval Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="documents" className="space-y-6 py-4">
            {/* Upload documents card */}
            <DocumentUploadCard
              chatbotId={chatbotId}
              userId={user?.id || ""}
              retrievalSettings={retrievalSettings}
              onUploadComplete={handleDocumentUploadComplete}
            />
            
            {/* Document list card */}
            <DocumentListCard
              chatbotId={chatbotId}
              documents={documents}
              isLoading={isDocumentsLoading}
              onUploadClick={() => {
                // Scroll to upload card
                document.querySelector("#upload-card")?.scrollIntoView({ behavior: "smooth" });
              }}
            />
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4 py-4">
            {/* Retrieval settings card */}
            <RetrievalSettingsCard
              chatbotId={chatbotId}
              settings={retrievalSettings}
              isLoading={isSettingsLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ChatbotDocuments;
