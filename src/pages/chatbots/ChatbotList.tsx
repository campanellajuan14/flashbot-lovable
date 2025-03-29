
import React, { useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MessageSquare, Plus, Search, MoreHorizontal, Copy, Edit, Trash, ExternalLink } from "lucide-react";

// Define a type for our chatbot data
interface Chatbot {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  conversationCount: number;
}

const ChatbotList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Mock data for chatbots
  const initialChatbots: Chatbot[] = [
    {
      id: "cb-001",
      name: "Customer Support Bot",
      description: "Handles customer inquiries and support tickets",
      isActive: true,
      createdAt: "2023-10-15",
      conversationCount: 78,
    },
    {
      id: "cb-002",
      name: "Product Recommendation Bot",
      description: "Helps customers find products based on their preferences",
      isActive: true,
      createdAt: "2023-11-05",
      conversationCount: 42,
    },
    {
      id: "cb-003",
      name: "FAQ Assistant",
      description: "Answers frequently asked questions about our services",
      isActive: false,
      createdAt: "2023-12-20",
      conversationCount: 4,
    },
  ];
  
  // Filter chatbots based on search query
  const filteredChatbots = initialChatbots.filter(chatbot => 
    chatbot.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    chatbot.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredChatbots.map((chatbot) => (
            <Card key={chatbot.id} className="dashboard-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant={chatbot.isActive ? "default" : "secondary"}>
                    {chatbot.isActive ? "Active" : "Inactive"}
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
                      <DropdownMenuItem className="flex cursor-pointer">
                        <Copy className="mr-2 h-4 w-4" />
                        Copy ID
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex cursor-pointer text-destructive focus:text-destructive">
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="text-xl">{chatbot.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {chatbot.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Conversations</p>
                    <p className="font-medium">{chatbot.conversationCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">{new Date(chatbot.createdAt).toLocaleDateString()}</p>
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
      </div>
    </DashboardLayout>
  );
};

export default ChatbotList;
