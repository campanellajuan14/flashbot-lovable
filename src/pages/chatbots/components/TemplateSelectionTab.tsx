
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import TemplateSelector from "../templates/TemplateSelector";
import { ChatbotTemplate } from "../templates/types";

interface TemplateSelectionTabProps {
  selectedTemplateId: string | null;
  onSelectTemplate: (template: ChatbotTemplate) => void;
  onStartFromScratch: () => void;
  onContinue: () => void;
}

const TemplateSelectionTab: React.FC<TemplateSelectionTabProps> = ({ 
  selectedTemplateId, 
  onSelectTemplate,
  onStartFromScratch,
  onContinue
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Seleccionar Plantilla</CardTitle>
        <CardDescription>
          Elige una plantilla preconfigurada para tu chatbot o comienza desde cero
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 border border-dashed border-primary/50 rounded-lg bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={onStartFromScratch}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/20 text-primary">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">Comenzar desde cero</h3>
              <p className="text-sm text-muted-foreground">
                Crea un chatbot personalizado sin usar una plantilla predefinida
              </p>
            </div>
          </div>
        </div>
        
        <TemplateSelector 
          selectedTemplateId={selectedTemplateId} 
          onSelectTemplate={onSelectTemplate} 
        />
        
        <div className="flex justify-end pt-4">
          <Button
            onClick={onContinue}
            disabled={!selectedTemplateId}
          >
            Continuar con esta plantilla
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateSelectionTab;
