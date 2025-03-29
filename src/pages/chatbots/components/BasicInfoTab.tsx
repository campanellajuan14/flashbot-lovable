
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import DocumentUploadCard from "@/components/chatbots/documents/DocumentUploadCard";
import SampleDocumentDownload from "@/components/chatbots/documents/SampleDocumentDownload";
import { ChatbotFormData } from "../types";

interface BasicInfoTabProps {
  form: ChatbotFormData;
  handleChange: (field: string, value: any) => void;
  chatbotId?: string;
  userId?: string;
}

const BasicInfoTab = ({ 
  form, 
  handleChange,
  chatbotId,
  userId
}: BasicInfoTabProps) => {
  const isNameValid = form.name.length > 0;
  const isDescriptionValid = form.description.length > 0;
  
  // Check if this is a Lovable Hackathon template (exact match or contains the name)
  const isLovableHackathonTemplate = form.name === "Lovable Hackathon Expert" || 
                                    form.name.toLowerCase().includes("lovable") && 
                                    form.name.toLowerCase().includes("hackathon");
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>Enter the basic details for your chatbot</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Chatbot Name</Label>
            <Input 
              type="text" 
              id="name" 
              value={form.name} 
              onChange={(e) => handleChange("name", e.target.value)} 
              required
            />
            {!isNameValid && (
              <p className="text-xs text-red-500">Chatbot name is required.</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="A brief description of your chatbot"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              required
            />
            {!isDescriptionValid && (
              <p className="text-xs text-red-500">Chatbot description is required.</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="isActive">
              Active
              <Switch 
                id="isActive" 
                checked={form.isActive} 
                onCheckedChange={(checked) => handleChange("isActive", checked)} 
                className="ml-3"
              />
            </Label>
          </div>
        </div>
        
        {/* Show sample document download component for all users with more prominence */}
        <div className="mt-8 pt-4 border-t">
          <h3 className="text-lg font-medium mb-2">Knowledge Base Resources</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Download sample documents to use as knowledge base for your chatbot.
          </p>
          
          <SampleDocumentDownload />
        </div>
        
        {/* Show document uploads section for Lovable Hackathon template */}
        {isLovableHackathonTemplate && userId && (
          <div className="mt-8 pt-4 border-t">
            <h3 className="text-lg font-medium mb-2">Knowledge Base Documents</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload documents to train your Lovable Hackathon Expert with relevant information.
            </p>
            
            {chatbotId && (
              <DocumentUploadCard 
                chatbotId={chatbotId}
                userId={userId}
                retrievalSettings={{
                  chunk_size: 1000,
                  chunk_overlap: 200,
                  embedding_model: "text-embedding-ada-002"
                }}
                onUploadComplete={() => {
                  // Handle document upload completion
                  console.log("Document upload completed");
                }} 
              />
            )}
            {!chatbotId && (
              <div className="p-4 border rounded-md bg-yellow-50 text-yellow-800">
                Save your chatbot first to enable document uploads.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BasicInfoTab;
