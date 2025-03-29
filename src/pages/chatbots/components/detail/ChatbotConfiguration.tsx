
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Edit, Settings, FileText, Bot } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ChatbotConfigurationProps {
  chatbot: any;
  chatbotId: string;
}

const ChatbotConfiguration: React.FC<ChatbotConfigurationProps> = ({ chatbot, chatbotId }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Advanced Settings
            </CardTitle>
            <CardDescription>
              Customize the chatbot's behavior and response generation
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="model">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center">
                      <Bot className="mr-2 h-4 w-4" />
                      <span>AI Model Configuration</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pl-6 pb-2 pt-2 space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Current model:</span>{" "}
                        <Badge variant="outline" className="ml-2 font-mono">
                          {chatbot.settings?.model || "claude-3-haiku-20240307"}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Temperature:</span>{" "}
                        <Badge variant="outline" className="ml-2 font-mono">
                          {chatbot.settings?.temperature || "0.7"}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Max tokens:</span>{" "}
                        <Badge variant="outline" className="ml-2 font-mono">
                          {chatbot.settings?.maxTokens || "1000"}
                        </Badge>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Separator />

              <div className="flex flex-col items-center justify-center py-4">
                <p className="text-center mb-4 text-muted-foreground">
                  Edit the chatbot to modify advanced configuration
                </p>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  asChild
                >
                  <Link to={`/chatbots/${chatbotId}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Configuration
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Knowledge Base
            </CardTitle>
            <CardDescription>
              Documents and learning materials for your chatbot
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="bg-muted/30 p-4 rounded-lg border">
                <h3 className="text-sm font-semibold mb-1">Uploaded Documents</h3>
                <div className="text-2xl font-semibold">
                  {chatbot.document_count || "0"} 
                  <span className="text-sm font-normal text-muted-foreground ml-2">files</span>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col items-center justify-center py-4">
                <p className="text-center mb-4 text-muted-foreground">
                  Manage documents to improve your chatbot's knowledge
                </p>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  asChild
                >
                  <Link to={`/chatbots/${chatbotId}/documents`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Manage Documents
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="bg-muted/30">
          <CardTitle>Advanced Configuration</CardTitle>
          <CardDescription>
            Additional settings for developers and advanced users
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-muted/30 p-4 rounded-lg border">
              <h3 className="text-sm font-semibold mb-1">API Status</h3>
              <div className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                <span>Available</span>
              </div>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-lg border">
              <h3 className="text-sm font-semibold mb-1">API Key</h3>
              <div className="text-muted-foreground">
                <span className="font-mono text-xs">••••••••••••••••</span>
              </div>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-lg border">
              <h3 className="text-sm font-semibold mb-1">Status</h3>
              <Badge variant={chatbot.is_active ? "success" : "warning"}>
                {chatbot.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
          
          <div className="mt-6 flex justify-center">
            <Button 
              variant="outline" 
              className="gap-2"
              asChild
            >
              <Link to={`/chatbots/${chatbotId}/edit`}>
                <Settings className="h-4 w-4 mr-2" />
                Advanced Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatbotConfiguration;
