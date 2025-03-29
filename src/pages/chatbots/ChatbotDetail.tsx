
import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Edit, Trash2, Loader2, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
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
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ShareSettings from "@/components/chatbots/share/ShareSettings";
import ChatbotInformation from "./components/detail/ChatbotInformation";
import ChatbotConfiguration from "./components/detail/ChatbotConfiguration";

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
              type="button"
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
              <TabsTrigger value="info" type="button">Information</TabsTrigger>
              <TabsTrigger value="config" type="button">Configuration</TabsTrigger>
              <TabsTrigger value="share" type="button">Share</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="space-y-6 animate-fade-in">
              <ChatbotInformation 
                chatbot={chatbot} 
                onDelete={() => setShowDeleteDialog(true)} 
              />
            </TabsContent>
            
            <TabsContent value="config" className="animate-fade-in">
              <ChatbotConfiguration 
                chatbot={chatbot} 
                chatbotId={chatbotId || ''} 
              />
            </TabsContent>
            
            <TabsContent value="share" className="animate-fade-in">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center">
                      <Share2 className="mr-2 h-5 w-5 text-primary" />
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
          
          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteChatbot}
                  disabled={deleteChatbotMutation.isPending}
                  type="button"
                >
                  {deleteChatbotMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default ChatbotDetail;
