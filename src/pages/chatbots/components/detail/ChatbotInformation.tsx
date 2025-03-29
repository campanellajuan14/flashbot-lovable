
import React from "react";
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
import { FileText, Trash2 } from "lucide-react";

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
                <CardDescription className="mt-1">
                  {chatbot.description || "No description"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-medium mb-2">Personality</h3>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Tone:</span>{" "}
                    <span className="text-foreground">{behaviorSettings.tone || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Style:</span>{" "}
                    <span className="text-foreground">{behaviorSettings.style || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Language:</span>{" "}
                    <span className="text-foreground">
                      {behaviorSettings.language === "es"
                        ? "Spanish"
                        : behaviorSettings.language === "en"
                        ? "English"
                        : behaviorSettings.language || "Not specified"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Emojis:</span>{" "}
                    <span className="text-foreground">{behaviorSettings.useEmojis ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-2">
                  Behavior
                </h3>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Ask questions:</span>{" "}
                    <span className="text-foreground">{behaviorSettings.askQuestions ? "Yes" : "No"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Suggest solutions:
                    </span>{" "}
                    <span className="text-foreground">{behaviorSettings.suggestSolutions ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>

              {behaviorSettings.instructions && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2">
                      Custom instructions
                    </h3>
                    <div className="text-sm bg-muted/50 p-3 rounded-md border">
                      {behaviorSettings.instructions}
                    </div>
                  </div>
                </>
              )}
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
        <Card className="overflow-hidden border-t-4 border-t-primary">
          <CardHeader className="bg-muted/30">
            <CardTitle>Model Configuration</CardTitle>
            <CardDescription>
              Technical configuration of the AI model
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <h3 className="text-sm font-medium mb-2">Model</h3>
                  <div className="text-lg font-mono">
                    {chatbotSettings.model || "claude-3-haiku-20240307"}
                  </div>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <h3 className="text-sm font-medium mb-2">
                    Temperature
                  </h3>
                  <div className="text-lg font-mono">
                    {chatbotSettings.temperature || "0.7"}
                  </div>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <h3 className="text-sm font-medium mb-2">
                    Max Tokens
                  </h3>
                  <div className="text-lg font-mono">
                    {chatbotSettings.maxTokens || "1000"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle>Usage Statistics</CardTitle>
            <CardDescription>
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
