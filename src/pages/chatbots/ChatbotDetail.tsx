
import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Settings, Edit, Trash2, FileText, Loader2, Share2 } from "lucide-react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ShareSettings from "@/components/chatbots/ShareSettings";

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

const ChatbotDetail = () => {
  const { id: chatbotId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  const {
    data: chatbot,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["chatbot", chatbotId],
    queryFn: async () => {
      if (!chatbotId) throw new Error("Chatbot ID required");

      const { data, error } = await supabase
        .from("chatbots")
        .select("*")
        .eq("id", chatbotId)
        .single();

      if (error) throw error;
      
      if (data) {
        data.behavior = data.behavior || {};
        data.settings = data.settings || {};
      }
      
      return data;
    },
  });

  const deleteChatbotMutation = useMutation({
    mutationFn: async () => {
      if (!chatbotId) throw new Error("Chatbot ID required");

      const { error } = await supabase.from("chatbots").delete().eq("id", chatbotId);

      if (error) throw error;
      return chatbotId;
    },
    onSuccess: () => {
      toast({
        title: "Chatbot deleted",
        description: "The chatbot has been successfully deleted.",
      });
      navigate("/chatbots");
    },
    onError: (error) => {
      console.error("Error deleting chatbot:", error);
      toast({
        title: "Error",
        description:
          "Failed to delete the chatbot. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async () => {
      if (!chatbotId || !chatbot) throw new Error("Chatbot required");

      const { error } = await supabase
        .from("chatbots")
        .update({ is_active: !chatbot.is_active })
        .eq("id", chatbotId);

      if (error) throw error;
      return !chatbot.is_active;
    },
    onSuccess: (newActiveState) => {
      toast({
        title: newActiveState
          ? "Chatbot activated"
          : "Chatbot deactivated",
        description: newActiveState
          ? "The chatbot has been successfully activated."
          : "The chatbot has been successfully deactivated.",
      });
      queryClient.invalidateQueries({ queryKey: ["chatbot", chatbotId] });
    },
    onError: (error) => {
      console.error("Error changing chatbot state:", error);
      toast({
        title: "Error",
        description:
          "Failed to change the chatbot state. Please try again.",
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !chatbot) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "An error occurred while loading the chatbot"}
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/chatbots")}>Back to Chatbots</Button>
      </div>
    );
  }

  const behaviorSettings = chatbot.behavior as BehaviorSettings;
  const chatbotSettings = chatbot.settings as ChatbotSettings;

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
                Chatbot details
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
              {chatbot.is_active ? "Deactivate" : "Activate"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link to={`/chatbots/${chatbotId}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button
              variant="default"
              size="sm"
              asChild
            >
              <Link to={`/chatbots/${chatbotId}/preview`}>
                <Play className="h-4 w-4 mr-2" />
                Preview
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4">
        <div className="container max-w-5xl mx-auto">
          <Tabs 
            defaultValue="info" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="info">Information</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="share">Share</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 space-y-6">
                  <Card>
                    <CardHeader>
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
                          <CardDescription className="mt-1">
                            {chatbot.description || "No description"}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium mb-1">Personality</h3>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium">Tone:</span>{" "}
                              {behaviorSettings.tone || "Not specified"}
                            </div>
                            <div>
                              <span className="font-medium">Style:</span>{" "}
                              {behaviorSettings.style || "Not specified"}
                            </div>
                            <div>
                              <span className="font-medium">Language:</span>{" "}
                              {behaviorSettings.language === "es"
                                ? "Spanish"
                                : behaviorSettings.language === "en"
                                ? "English"
                                : behaviorSettings.language || "Not specified"}
                            </div>
                            <div>
                              <span className="font-medium">Emojis:</span>{" "}
                              {behaviorSettings.useEmojis ? "Yes" : "No"}
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-sm font-medium mb-1">
                            Behavior
                          </h3>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium">Ask questions:</span>{" "}
                              {behaviorSettings.askQuestions ? "Yes" : "No"}
                            </div>
                            <div>
                              <span className="font-medium">
                                Suggest solutions:
                              </span>{" "}
                              {behaviorSettings.suggestSolutions ? "Yes" : "No"}
                            </div>
                          </div>
                        </div>

                        {behaviorSettings.instructions && (
                          <>
                            <Separator />
                            <div>
                              <h3 className="text-sm font-medium mb-1">
                                Custom instructions
                              </h3>
                              <div className="text-sm bg-muted p-2 rounded">
                                {behaviorSettings.instructions}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/chatbots/${chatbotId}/documents`}>
                          <FileText className="h-4 w-4 mr-2" />
                          Documents
                        </Link>
                      </Button>
                      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete chatbot?</DialogTitle>
                            <DialogDescription>
                              This action will permanently delete the chatbot {chatbot.name} and cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setShowDeleteDialog(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={handleDeleteChatbot}
                              disabled={deleteChatbotMutation.isPending}
                            >
                              {deleteChatbotMutation.isPending && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              )}
                              Delete
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardFooter>
                  </Card>
                </div>

                <div className="col-span-1 md:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Model Configuration</CardTitle>
                      <CardDescription>
                        Technical configuration of the AI model
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-medium mb-1">Model</h3>
                            <div className="text-sm">
                              {chatbotSettings.model || "claude-3-haiku-20240307"}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium mb-1">
                              Temperature
                            </h3>
                            <div className="text-sm">
                              {chatbotSettings.temperature || "0.7"}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium mb-1">
                              Max Tokens
                            </h3>
                            <div className="text-sm">
                              {chatbotSettings.maxTokens || "1000"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Usage Statistics</CardTitle>
                      <CardDescription>
                        Chatbot usage metrics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center p-6 text-muted-foreground">
                        <p>Statistics will be available soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="config">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="mr-2 h-5 w-5" />
                    Advanced Configuration
                  </CardTitle>
                  <CardDescription>
                    Advanced chatbot settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-6 text-muted-foreground">
                    <p>Edit the chatbot to modify advanced configuration</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      asChild
                    >
                      <Link to={`/chatbots/${chatbotId}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Configuration
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="share">
              <div className="space-y-4">
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Share2 className="mr-2 h-5 w-5" />
                      Share Chatbot
                    </CardTitle>
                    <CardDescription>
                      Configure how to share your chatbot on other websites
                    </CardDescription>
                  </CardHeader>
                </Card>
                
                <ShareSettings />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ChatbotDetail;
