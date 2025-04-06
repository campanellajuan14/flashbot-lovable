
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Share } from "lucide-react";

interface ChatbotShareProps {
  chatbotId: string;
}

const ChatbotShare: React.FC<ChatbotShareProps> = ({ chatbotId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Share</CardTitle>
        <CardDescription>
          Options to share your chatbot
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-6 bg-muted rounded-lg border flex flex-col items-center justify-center text-center">
          <h3 className="font-medium text-lg mb-2">Share your chatbot</h3>
          <p className="text-muted-foreground mb-4">
            Configure how your chatbot looks and behaves when shared with others.
          </p>
          <Button asChild>
            <Link to={`/chatbots/${chatbotId}/edit?tab=share`}>
              <Share className="h-4 w-4 mr-2" />
              Configure sharing options
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatbotShare;
