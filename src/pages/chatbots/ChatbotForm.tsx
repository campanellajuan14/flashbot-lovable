
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";

import DocumentNavigation from "@/components/chatbots/DocumentNavigation";
import InitialChoiceDialog from "./components/InitialChoiceDialog";
import { useChatbotForm } from "./hooks/useChatbotForm";
import LoadingState from "./components/LoadingState";
import { getTemplateById } from "./templates/data";
import ChatbotFormHeader from "./components/ChatbotFormHeader";
import FormActions from "./components/FormActions";
import BasicInfoTab from "./components/BasicInfoTab";
import AdvancedSettingsTab from "./components/AdvancedSettingsTab";
import ChatbotWhatsAppSettings from "@/components/whatsapp/ChatbotWhatsAppSettings";
import { Separator } from "@/components/ui/separator";

const ChatbotForm = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [showInitialDialog, setShowInitialDialog] = useState<boolean>(!id);
  
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

  // Ensure we prevent default and stop propagation
  const handleStartFromScratch = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowInitialDialog(false);
  };
  
  // Ensure we prevent default and stop propagation
  const handleSelectTemplateFromDialog = (templateId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (templateId === "") {
      // View all templates
      setShowInitialDialog(false);
    } else {
      // Select specific template
      const template = getTemplateById(templateId);
      if (template) {
        handleTemplateSelect(template);
        setShowInitialDialog(false);
      }
    }
  };

  // Close the dialog if we're editing an existing chatbot
  useEffect(() => {
    if (id) {
      setShowInitialDialog(false);
    }
  }, [id]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <LoadingState />
        </div>
      </DashboardLayout>
    );
  }

  // Explicit function to handle form submission with prevent default
  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(form); // Pass the form object to handleSubmit
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Initial choice dialog */}
        <InitialChoiceDialog 
          open={showInitialDialog}
          onOpenChange={setShowInitialDialog}
          onStartFromScratch={handleStartFromScratch}
          onSelectTemplate={handleSelectTemplateFromDialog}
        />
        
        <ChatbotFormHeader isEditing={isEditing} />

        {/* Document Navigation - Only show in edit mode */}
        {isEditing && (
          <div className="mb-6">
            <DocumentNavigation chatbotId={id || ""} />
          </div>
        )}

        <form onSubmit={onSubmitForm} className="text-left space-y-6">
          {/* Basic Information Section */}
          <div className="mb-6">
            <BasicInfoTab 
              form={form}
              handleChange={handleChange}
              handleNestedChange={handleNestedChange}
              chatbotId={id}
              userId={user?.id}
            />
          </div>
          
          {/* Advanced Settings Section */}
          <div className="mb-6">
            <AdvancedSettingsTab 
              form={form}
              aiProvider={aiProvider}
              handleNestedChange={handleNestedChange}
              handleProviderChange={handleProviderChange}
            />
          </div>
          
          {/* WhatsApp Integration Section - Only show in edit mode */}
          {isEditing && (
            <>
              <Separator className="my-6" />
              <div className="mb-6">
                <ChatbotWhatsAppSettings />
              </div>
            </>
          )}
          
          <FormActions 
            isSubmitting={isSubmitting}
            isEditing={isEditing}
          />
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ChatbotForm;
