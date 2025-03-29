
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import TemplateSelector from "../templates/TemplateSelector";
import { ChatbotTemplate } from "../templates/types";

interface TemplateSelectionTabProps {
  selectedTemplateId: string | null;
  onSelectTemplate: (template: ChatbotTemplate) => void;
  onStartFromScratch: () => void;
}

const TemplateSelectionTab: React.FC<TemplateSelectionTabProps> = ({ 
  selectedTemplateId, 
  onSelectTemplate,
  onStartFromScratch
}) => {
  const handleStartFromScratch = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onStartFromScratch();
  };

  const handleTemplateClick = (template: ChatbotTemplate) => {
    onSelectTemplate(template);
    onStartFromScratch(); // Navigate to the next tab on template selection
  };

  return (
    <Card className="text-left">
      <CardHeader>
        <CardTitle>Select Template</CardTitle>
        <CardDescription>
          Choose a preconfigured template for your chatbot or start from scratch
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div 
          className="p-4 border border-dashed border-primary/50 rounded-lg bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={handleStartFromScratch}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/20 text-primary">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">Start from scratch</h3>
              <p className="text-sm text-muted-foreground">
                Create a custom chatbot without using a predefined template
              </p>
            </div>
          </div>
        </div>
        
        <TemplateSelector 
          selectedTemplateId={selectedTemplateId} 
          onSelectTemplate={onSelectTemplate} 
          onTemplateClick={handleTemplateClick}
        />
      </CardContent>
    </Card>
  );
};

export default TemplateSelectionTab;
