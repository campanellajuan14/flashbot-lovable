
import React from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

import DocumentNavigation from "@/components/chatbots/DocumentNavigation";
import BasicInfoTab from "./components/BasicInfoTab";
import PersonalityTab from "./components/PersonalityTab";
import AdvancedSettingsTab from "./components/AdvancedSettingsTab";
import TemplateSelectionTab from "./components/TemplateSelectionTab";
import { useChatbotForm } from "./hooks/useChatbotForm";

const ChatbotForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const {
    form,
    aiProvider,
    isSubmitting,
    isLoading,
    isEditing,
    selectedTemplateId,
    handleChange,
    handleNestedChange,
    handleProviderChange,
    handleTemplateSelect,
    handleSubmit
  } = useChatbotForm({ id, userId: user?.id });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditing ? "Editar Chatbot" : "Crear Nuevo Chatbot"}
            </h1>
            <p className="text-muted-foreground">
              Configura la personalidad y comportamiento de tu chatbot
            </p>
          </div>
        </div>

        {isEditing && (
          <DocumentNavigation chatbotId={id || ""} />
        )}

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue={isEditing ? "basic" : "templates"}>
            <TabsList className="grid w-full grid-cols-4">
              {!isEditing && (
                <TabsTrigger value="templates">Plantillas</TabsTrigger>
              )}
              <TabsTrigger value="basic">Información Básica</TabsTrigger>
              <TabsTrigger value="personality">Personalidad</TabsTrigger>
              <TabsTrigger value="advanced">Configuración Avanzada</TabsTrigger>
            </TabsList>
            
            {!isEditing && (
              <TabsContent value="templates" className="space-y-4 pt-4">
                <TemplateSelectionTab 
                  selectedTemplateId={selectedTemplateId}
                  onSelectTemplate={handleTemplateSelect}
                />
              </TabsContent>
            )}
            
            <TabsContent value="basic" className="space-y-4 pt-4">
              <BasicInfoTab 
                form={form} 
                handleChange={handleChange} 
              />
            </TabsContent>
            
            <TabsContent value="personality" className="space-y-4 pt-4">
              <PersonalityTab 
                form={form} 
                handleNestedChange={handleNestedChange} 
              />
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4 pt-4">
              <AdvancedSettingsTab 
                form={form} 
                aiProvider={aiProvider}
                handleNestedChange={handleNestedChange}
                handleProviderChange={handleProviderChange}
              />
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate("/chatbots")}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Actualizando..." : "Creando..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? "Actualizar Chatbot" : "Crear Chatbot"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ChatbotForm;
