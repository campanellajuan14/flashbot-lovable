
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CloudUpload, FileText } from "lucide-react";
import DocumentUploadCard from "@/components/chatbots/documents/DocumentUploadCard";
import { ChatbotFormData } from "../types";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";

interface BasicInfoTabProps {
  form: ChatbotFormData;
  handleChange: (field: string, value: any) => void;
  chatbotId?: string;
  userId?: string;
}

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({ 
  form, 
  handleChange, 
  chatbotId, 
  userId 
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [tempDocuments, setTempDocuments] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  
  // Use a temporary ID for the chatbot if we're creating a new one
  const [tempChatbotId] = useState(() => {
    if (chatbotId) return chatbotId;
    
    // Check if we already have a temp ID in localStorage
    const existingId = localStorage.getItem('temp_chatbot_id');
    if (existingId) return existingId;
    
    // Generate a new temp ID
    const newId = `temp-${uuidv4()}`;
    localStorage.setItem('temp_chatbot_id', newId);
    return newId;
  });
  
  // Fetch temporary documents when mounting or after an upload
  const fetchTempDocuments = async () => {
    if (tempChatbotId.startsWith('temp-')) {
      setIsLoadingDocs(true);
      try {
        console.log("Fetching temporary documents for:", tempChatbotId);
        const { data, error } = await supabase.functions.invoke('kv-get-documents-by-chatbot', {
          body: {
            tempChatbotId
          }
        });
        
        if (error) {
          console.error("Error fetching temporary documents:", error);
          return;
        }
        
        if (data && Array.isArray(data.documents)) {
          setTempDocuments(data.documents);
          console.log(`Found ${data.documents.length} temporary documents`);
        }
      } catch (error) {
        console.error("Error fetching temporary documents:", error);
      } finally {
        setIsLoadingDocs(false);
      }
    }
  };

  // Fetch temp documents on mount
  useEffect(() => {
    fetchTempDocuments();
  }, [tempChatbotId]);

  const handleDocumentUploadComplete = () => {
    // Refresh the documents list
    fetchTempDocuments();
    
    // Only invalidate queries if we have a real chatbot ID
    if (chatbotId && !chatbotId.startsWith('temp-')) {
      queryClient.invalidateQueries({ queryKey: ["chatbot-documents", chatbotId] });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Configure the name and description for your chatbot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., Customer Support Assistant"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              A clear and descriptive name for your chatbot
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What does this chatbot do?"
              rows={3}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              A brief description of the chatbot's purpose and capabilities
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={form.isActive}
              onCheckedChange={(checked) => handleChange("isActive", checked)}
            />
            <Label htmlFor="active">Active</Label>
          </div>
        </CardContent>
      </Card>

      {userId && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <CloudUpload className="h-5 w-5 text-primary" />
              Knowledge Base
            </CardTitle>
            <CardDescription>
              Upload documents to train your chatbot and improve its responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentUploadCard
              chatbotId={tempChatbotId}
              userId={userId}
              retrievalSettings={{
                chunk_size: 1000,
                chunk_overlap: 200,
                embedding_model: "text-embedding-ada-002"
              }}
              onUploadComplete={handleDocumentUploadComplete}
            />
            
            {/* Show temporary documents */}
            {isLoadingDocs ? (
              <div className="mt-4 text-center text-muted-foreground">Loading documents...</div>
            ) : tempDocuments.length > 0 ? (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Uploaded documents ({tempDocuments.length})</h3>
                <div className="border rounded-md divide-y">
                  {tempDocuments.map((doc, index) => (
                    <div key={index} className="p-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{doc.name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  These documents will be processed when you save the chatbot.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BasicInfoTab;
