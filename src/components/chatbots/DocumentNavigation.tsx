
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight } from "lucide-react";

interface DocumentNavigationProps {
  chatbotId: string;
}

const DocumentNavigation: React.FC<DocumentNavigationProps> = ({ chatbotId }) => {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-accent/10">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-medium">Documents</h3>
          <p className="text-sm text-muted-foreground">
            Upload documents to improve your chatbot's responses
          </p>
        </div>
      </div>
      <Button asChild size="sm">
        <Link to={`/chatbots/${chatbotId}/documents`}>
          Manage Documents
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
};

export default DocumentNavigation;
