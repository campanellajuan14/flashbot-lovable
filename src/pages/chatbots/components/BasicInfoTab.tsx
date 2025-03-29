
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DocumentUploadCard from "@/components/chatbots/documents/DocumentUploadCard";
import SampleDocumentDownload from "@/components/chatbots/documents/SampleDocumentDownload";
import { ChatbotFormData } from "../types";

interface BasicInfoTabProps {
  form: ChatbotFormData;
  handleChange: (field: string, value: any) => void;
  handleNestedChange: (parent: string, field: string, value: any) => void;
  chatbotId?: string;
  userId?: string;
}

const BasicInfoTab = ({ 
  form, 
  handleChange,
  handleNestedChange,
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
        {/* Grouped Name and Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Label htmlFor="isActive">Status</Label>
            <div className="flex items-center space-x-2 h-10">
              <Switch 
                id="isActive" 
                checked={form.isActive} 
                onCheckedChange={(checked) => handleChange("isActive", checked)} 
              />
              <span className="text-sm">{form.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="A brief description of your chatbot"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            required
            rows={2}
          />
          {!isDescriptionValid && (
            <p className="text-xs text-red-500">Chatbot description is required.</p>
          )}
        </div>

        {/* Language Selection */}
        <div className="space-y-2 max-w-md">
          <Label htmlFor="language" className="text-left block">Primary Language</Label>
          <Select
            value={form.personality.language}
            onValueChange={(value) => handleNestedChange("personality", "language", value)}
          >
            <SelectTrigger id="language" className="max-w-xs">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="spanish">Spanish</SelectItem>
              <SelectItem value="french">French</SelectItem>
              <SelectItem value="german">German</SelectItem>
              <SelectItem value="chinese">Chinese</SelectItem>
              <SelectItem value="japanese">Japanese</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Greeting and Custom Instructions */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="customization">
            <AccordionTrigger className="text-md font-medium">Personality & Behavior</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="greeting">Initial Greeting</Label>
                <Textarea
                  id="greeting"
                  placeholder="Hello! I'm a virtual assistant. How can I help you today?"
                  rows={2}
                  value={form.personality.greeting}
                  onChange={(e) => handleNestedChange("personality", "greeting", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The first message users will see when starting a conversation
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instructions">Custom Instructions</Label>
                <Textarea
                  id="instructions"
                  placeholder="Provide specific instructions for how the chatbot should respond..."
                  rows={4}
                  value={form.personality.instructions}
                  onChange={(e) => handleNestedChange("personality", "instructions", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Additional instructions to guide your chatbot's behavior
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select
                    value={form.personality.tone}
                    onValueChange={(value) => handleNestedChange("personality", "tone", value)}
                  >
                    <SelectTrigger id="tone">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="style">Communication Style</Label>
                  <Select
                    value={form.personality.style}
                    onValueChange={(value) => handleNestedChange("personality", "style", value)}
                  >
                    <SelectTrigger id="style">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concise">Concise</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="helpful">Helpful</SelectItem>
                      <SelectItem value="empathetic">Empathetic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        {/* Knowledge Base Resources */}
        <div className="mt-4 pt-2 border-t">
          <h3 className="text-lg font-medium mb-2">Knowledge Base Resources</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Download sample documents to use as knowledge base for your chatbot.
          </p>
          
          <SampleDocumentDownload />
        </div>
        
        {/* Show document uploads section for Lovable Hackathon template */}
        {isLovableHackathonTemplate && userId && (
          <div className="mt-4 pt-2 border-t">
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
