
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, AwardIcon, TrendingUp } from "lucide-react";
import TemplateSelector from "../templates/TemplateSelector";
import { ChatbotTemplate } from "../templates/types";
import { getTemplateById } from "../templates/data";

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

  // Get the Lovable Hackathon Expert template for featured section
  const featuredTemplate = getTemplateById("lovable-hackathon-expert");

  return (
    <Card className="text-left">
      <CardHeader>
        <CardTitle>Select Template</CardTitle>
        <CardDescription>
          Choose a preconfigured template for your chatbot or start from scratch
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Featured Template - Lovable Hackathon Expert */}
        {featuredTemplate && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
              <AwardIcon className="h-4 w-4 mr-2 text-purple-500" />
              Featured Template
            </h3>
            <div 
              className="p-5 border-2 border-purple-300 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 cursor-pointer hover:bg-purple-100 transition-colors"
              onClick={() => handleTemplateClick(featuredTemplate)}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-md bg-purple-200 text-purple-700">
                  <AwardIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-xl text-purple-700">{featuredTemplate.name}</h3>
                  <p className="text-sm text-purple-600">
                    {featuredTemplate.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div 
          className="p-5 border border-dashed border-primary/50 rounded-lg bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={handleStartFromScratch}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-md bg-primary/20 text-primary">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-lg">Start from scratch</h3>
              <p className="text-sm text-muted-foreground">
                Create a custom chatbot without using a predefined template
              </p>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">All Templates</h3>
          <TemplateSelector 
            selectedTemplateId={selectedTemplateId} 
            onSelectTemplate={onSelectTemplate} 
            onTemplateClick={handleTemplateClick}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateSelectionTab;
