
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TemplateSelector from "../templates/TemplateSelector";
import { ChatbotTemplate } from "../templates/types";

interface TemplateSelectionTabProps {
  selectedTemplateId: string | null;
  onSelectTemplate: (template: ChatbotTemplate) => void;
}

const TemplateSelectionTab: React.FC<TemplateSelectionTabProps> = ({ 
  selectedTemplateId, 
  onSelectTemplate 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Seleccionar Plantilla</CardTitle>
        <CardDescription>
          Elige una plantilla preconfigurada para tu chatbot o comienza desde cero
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TemplateSelector 
          selectedTemplateId={selectedTemplateId} 
          onSelectTemplate={onSelectTemplate} 
        />
      </CardContent>
    </Card>
  );
};

export default TemplateSelectionTab;
