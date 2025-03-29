
import React from "react";
import { chatbotTemplates, TEMPLATE_ICONS } from "./data";
import { ChatbotTemplate } from "./types";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TemplateSelectorProps {
  selectedTemplateId: string | null;
  onSelectTemplate: (template: ChatbotTemplate) => void;
  onTemplateClick?: (template: ChatbotTemplate) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplateId,
  onSelectTemplate,
  onTemplateClick
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chatbotTemplates.map((template) => {
          const IconComponent = TEMPLATE_ICONS[template.icon as keyof typeof TEMPLATE_ICONS];
          
          return (
            <Card 
              key={template.id}
              className={cn(
                "cursor-pointer transition-all hover:border-primary hover:shadow-md",
                selectedTemplateId === template.id 
                  ? "border-2 border-primary shadow-md" 
                  : "border border-border"
              )}
              onClick={() => {
                if (onTemplateClick) {
                  onTemplateClick(template);
                } else {
                  onSelectTemplate(template);
                }
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                  
                  <Badge variant="outline" className="capitalize">
                    {template.category.replace("-", " ")}
                  </Badge>
                </div>
                <CardDescription className="mt-2">{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Model:</span>
                    <span className="font-medium">{template.settings.model}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tone:</span>
                    <span className="font-medium capitalize">{template.personality.tone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Style:</span>
                    <span className="font-medium capitalize">{template.personality.style}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TemplateSelector;
