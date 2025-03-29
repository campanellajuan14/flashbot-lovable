
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Trash2, Save, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface BehaviorSettings {
  tone?: string;
  style?: string;
  language?: string;
  useEmojis?: boolean;
  askQuestions?: boolean;
  suggestSolutions?: boolean;
  instructions?: string;
  [key: string]: any;
}

interface ChatbotSettings {
  model?: string;
  temperature?: string | number;
  maxTokens?: string | number;
  [key: string]: any;
}

interface ChatbotInformationProps {
  chatbot: any;
  onDelete: () => void;
}

const ChatbotInformation: React.FC<ChatbotInformationProps> = ({ chatbot, onDelete }) => {
  const behaviorSettings = chatbot.behavior as BehaviorSettings;
  const chatbotSettings = chatbot.settings as ChatbotSettings;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for the editable instructions
  const [instructions, setInstructions] = useState(behaviorSettings.instructions || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Mutation for updating the instructions
  const updateInstructionsMutation = useMutation({
    mutationFn: async () => {
      const updatedBehavior = {
        ...chatbot.behavior,
        instructions: instructions
      };
      
      const { error } = await supabase
        .from("chatbots")
        .update({ behavior: updatedBehavior })
        .eq("id", chatbot.id);
        
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Instructions updated",
        description: "The chatbot instructions have been updated successfully."
      });
      queryClient.invalidateQueries({ queryKey: ["chatbot", chatbot.id] });
      setIsEditing(false);
      setIsSaving(false);
    },
    onError: (error) => {
      console.error("Error updating instructions:", error);
      toast({
        title: "Error",
        description: "Failed to update the instructions. Please try again.",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  });
  
  const handleSaveInstructions = () => {
    setIsSaving(true);
    updateInstructionsMutation.mutate();
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="col-span-1 space-y-6">
        <Card className="overflow-hidden border-l-4 border-l-primary">
          <CardHeader className="bg-muted/30">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {chatbot.name}
                  {chatbot.is_active ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50">
                      Inactive
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-1 text-left">
                  {chatbot.description || "No description"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-medium mb-2 text-left">Personality</h3>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div className="text-left">
                    <span className="font-medium text-muted-foreground">Tone:</span>{" "}
                    <span className="text-foreground">{behaviorSettings.tone || "Not specified"}</span>
                  </div>
                  <div className="text-left">
                    <span className="font-medium text-muted-foreground">Style:</span>{" "}
                    <span className="text-foreground">{behaviorSettings.style || "Not specified"}</span>
                  </div>
                  <div className="text-left">
                    <span className="font-medium text-muted-foreground">Language:</span>{" "}
                    <span className="text-foreground">
                      {behaviorSettings.language === "es"
                        ? "Spanish"
                        : behaviorSettings.language === "en"
                        ? "English"
                        : behaviorSettings.language || "Not specified"}
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="font-medium text-muted-foreground">Emojis:</span>{" "}
                    <span className="text-foreground">{behaviorSettings.useEmojis ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-2 text-left">
                  Behavior
                </h3>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div className="text-left">
                    <span className="font-medium text-muted-foreground">Ask questions:</span>{" "}
                    <span className="text-foreground">{behaviorSettings.askQuestions ? "Yes" : "No"}</span>
                  </div>
                  <div className="text-left">
                    <span className="font-medium text-muted-foreground">
                      Suggest solutions:
                    </span>{" "}
                    <span className="text-foreground">{behaviorSettings.suggestSolutions ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between bg-muted/10 border-t">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/chatbots/${chatbot.id}/documents`}>
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onDelete}
              type="button"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="col-span-1 md:col-span-2 space-y-6">
        {/* Custom Instructions Section - Moved to top for prominence */}
        <Card className="overflow-hidden border-t-4 border-t-primary">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-left">Custom Instructions</CardTitle>
            <CardDescription className="text-left">
              Define how your chatbot should respond to users
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="text-left text-sm text-muted-foreground mb-2">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <span>These instructions tell the AI how to behave and respond to users.</span>
                    </div>
                  </div>
                  <Textarea 
                    value={instructions} 
                    onChange={(e) => setInstructions(e.target.value)}
                    className="min-h-[150px] text-left font-mono text-sm"
                    placeholder="Enter instructions for your chatbot..."
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setInstructions(behaviorSettings.instructions || "");
                        setIsEditing(false);
                      }}
                      type="button"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveInstructions}
                      disabled={isSaving}
                      type="button"
                    >
                      {isSaving ? (
                        <div className="flex items-center">
                          <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full"></div>
                          Saving...
                        </div>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Instructions
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm bg-muted/50 p-4 rounded-md border text-left min-h-[100px] whitespace-pre-wrap">
                    {behaviorSettings.instructions ? (
                      behaviorSettings.instructions
                    ) : (
                      <span className="text-muted-foreground italic">No custom instructions set.</span>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(true)}
                      type="button"
                    >
                      Edit Instructions
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-t-4 border-t-primary">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-left">Model Configuration</CardTitle>
            <CardDescription className="text-left">
              Technical configuration of the AI model
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <h3 className="text-sm font-medium mb-2 text-left">Model</h3>
                  <div className="text-lg font-mono text-left">
                    {chatbotSettings.model || "claude-3-haiku-20240307"}
                  </div>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <h3 className="text-sm font-medium mb-2 text-left">
                    Temperature
                  </h3>
                  <div className="text-lg font-mono text-left">
                    {chatbotSettings.temperature || "0.7"}
                  </div>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <h3 className="text-sm font-medium mb-2 text-left">
                    Max Tokens
                  </h3>
                  <div className="text-lg font-mono text-left">
                    {chatbotSettings.maxTokens || "1000"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-left">Usage Statistics</CardTitle>
            <CardDescription className="text-left">
              Chatbot usage metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="py-8">
            <div className="text-center p-6 text-muted-foreground">
              <p>Statistics will be available soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChatbotInformation;
