
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MessageSquare, Plus, Search, MoreHorizontal, Copy, Edit, Trash, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

// Define a type for our chatbot data
interface Chatbot {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  user_id: string;
  settings: Record<string, any>;
  behavior: Record<string, any>;
}

const ChatbotList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch chatbots from Supabase
  const { data: chatbots, isLoading, isError, refetch } = useQuery({
    queryKey: ['chatbots', user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as Chatbot[];
    },
    enabled: !!user,
  });

  // Function to copy chatbot ID
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Chatbot ID has been copied to your clipboard",
      });
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  // Function to delete a chatbot
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this chatbot?")) {
      try {
        const { error } = await supabase
          .from('chatbots')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        toast({
          title: "Chatbot deleted",
          description: "The chatbot has been successfully deleted",
        });
        
        // Refetch chatbots to update the list
        refetch();
      } catch (err) {
        console.error("Error deleting chatbot:", err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete the chatbot",
        });
      }
    }
  };
  
  // Filter chatbots based on search query
  const filteredChatbots = chatbots?.filter(chatbot => 
    chatbot.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (chatbot.description && chatbot.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  // Calculate conversation count (mocked for now)
  const getConversationCount = (chatbotId: string) => {
    // In a real implementation, you might want to query the conversations table
    // For now, let's return a random number
    return Math.floor(Math.random() * 100);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Chatbots</h1>
            <p className="text-muted-foreground">
              Manage and monitor all your chatbots in one place
            </p>
          </div>
          <Button asChild>
            <Link to="/chatbots/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Chatbot
            </Link>
          </Button>
        </div>

        <div className="w-full max-w-md">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search chatbots..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="text-center py-8">
            <div className="text-destructive mb-2">Error loading chatbots</div>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredChatbots.map((chatbot) => (
                <Card key={chatbot.id} className="dashboard-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={chatbot.is_active ? "default" : "secondary"}>
                        {chatbot.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/chatbots/${chatbot.id}`} className="flex w-full cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/chatbots/${chatbot.id}/preview`} className="flex w-full cursor-pointer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Preview
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex cursor-pointer"
                            onClick={() => copyToClipboard(chatbot.id)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy ID
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => handleDelete(chatbot.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle className="text-xl">{chatbot.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {chatbot.description || "No description provided"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Conversations</p>
                        <p className="font-medium">{getConversationCount(chatbot.id)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Created</p>
                        <p className="font-medium">{new Date(chatbot.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/chatbots/${chatbot.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link to={`/chatbots/${chatbot.id}/preview`}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Try It
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            {filteredChatbots.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-semibold">No chatbots found</h3>
                <p className="mt-2 text-muted-foreground">
                  {searchQuery ? "Try a different search term" : "Create your first chatbot to get started"}
                </p>
                <Button className="mt-4" asChild>
                  <Link to="/chatbots/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Chatbot
                  </Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ChatbotList;
