
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, Wand2, MessageCircle, AwardIcon, TrendingUp } from "lucide-react";
import { chatbotTemplates, TEMPLATE_ICONS } from "../templates/data";

interface InitialChoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartFromScratch: () => void;
  onSelectTemplate: (templateId: string) => void;
}

const InitialChoiceDialog: React.FC<InitialChoiceDialogProps> = ({
  open,
  onOpenChange,
  onStartFromScratch,
  onSelectTemplate
}) => {
  // Get Lovable Hackathon Expert as first template
  const lovableHackathonTemplate = chatbotTemplates.find(t => t.id === "lovable-hackathon-expert");
  
  // Select just 2 other featured templates
  const otherTemplates = chatbotTemplates
    .filter(t => t.id !== "lovable-hackathon-expert" && t.id !== "technical-support")
    .slice(0, 2);
  
  // Combine templates with Lovable Hackathon Expert first
  const featuredTemplates = lovableHackathonTemplate 
    ? [lovableHackathonTemplate, ...otherTemplates]
    : otherTemplates;
  
  // Helper function to get the correct icon component
  const getIconComponent = (iconName: string) => {
    if (iconName === "lovable") {
      return <AwardIcon className="h-6 w-6 text-purple-500" />;
    }
    
    switch(iconName) {
      case "messageCircle":
        return <MessageCircle className="h-6 w-6 text-primary" />;
      case "wand2":
        return <Wand2 className="h-6 w-6 text-primary" />;
      case "plusCircle":
        return <PlusCircle className="h-6 w-6 text-primary" />;
      default:
        const IconComponent = TEMPLATE_ICONS[iconName as keyof typeof TEMPLATE_ICONS];
        return IconComponent ? <IconComponent className="h-6 w-6 text-primary" /> : <MessageCircle className="h-6 w-6 text-primary" />;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl w-[92vw]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-left">Create a new chatbot</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8 py-6">
          {/* Start from scratch option */}
          <div 
            className="flex items-center p-6 border rounded-lg hover:border-primary cursor-pointer hover:bg-accent/50 transition-all"
            onClick={onStartFromScratch}
          >
            <div className="mr-5 p-4 bg-primary/10 rounded-full">
              <PlusCircle className="h-7 w-7 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-xl">Start from scratch</h3>
              <p className="text-md text-muted-foreground">Create a custom chatbot with your own settings</p>
            </div>
          </div>
          
          {/* Template option */}
          <div className="space-y-5">
            <div className="flex items-center px-4">
              <div className="mr-5 p-4 bg-primary/10 rounded-full">
                <Wand2 className="h-7 w-7 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-xl">Use a template</h3>
                <p className="text-md text-muted-foreground">Start with a pre-configured template</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featuredTemplates.map((template, index) => {
                // Apply special styling to the Lovable Hackathon Expert template
                const isLovableTemplate = template.id === "lovable-hackathon-expert";
                
                return (
                  <div 
                    key={template.id}
                    className={`border rounded-lg p-5 hover:border-primary cursor-pointer hover:bg-accent/50 transition-all flex flex-col items-center text-center ${
                      isLovableTemplate ? 'border-purple-400 border-2 bg-gradient-to-br from-purple-50 to-purple-100 shadow-sm' : ''
                    }`}
                    onClick={() => onSelectTemplate(template.id)}
                  >
                    <div className={`p-3 ${isLovableTemplate ? 'bg-purple-200 text-purple-700' : 'bg-primary/10'} rounded-full mb-4`}>
                      {getIconComponent(template.icon)}
                    </div>
                    <h4 className={`text-lg font-medium ${isLovableTemplate ? 'text-purple-700' : ''}`}>
                      {template.name}
                      {isLovableTemplate && (
                        <span className="block text-xs text-purple-500 mt-1 font-bold">Recommended</span>
                      )}
                    </h4>
                  </div>
                );
              })}
            </div>
            
            <Button 
              variant="link" 
              className="w-full text-lg mt-4" 
              onClick={() => onSelectTemplate("")}
            >
              View all templates
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InitialChoiceDialog;
