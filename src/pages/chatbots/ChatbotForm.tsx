
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
import ChatbotFormTabs from "./components/ChatbotFormTabs";
import FormActions from "./components/FormActions";

const ChatbotForm = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("basic");
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

  const handleStartFromScratch = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault(); // Prevent default if event is passed
      e.stopPropagation(); // Stop event propagation
    }
    setShowInitialDialog(false);
    setActiveTab("basic");
  };
  
  const handleSelectTemplateFromDialog = (templateId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault(); // Prevent default if event is passed
      e.stopPropagation(); // Stop event propagation
    }
    
    if (templateId === "") {
      // View all templates
      setShowInitialDialog(false);
      setActiveTab("templates");
    } else {
      // Select specific template
      const template = getTemplateById(templateId);
      if (template) {
        handleTemplateSelect(template);
        setShowInitialDialog(false);
        setActiveTab("basic");
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

  // Dedicated function to handle form submission
  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault(); // Ensure we prevent default form submission
    e.stopPropagation(); // Stop event propagation
    handleSubmit(e);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Initial choice dialog */}
        <InitialChoiceDialog 
          open={showInitialDialog}
          onOpenChange={setShowInitialDialog}
          onStartFromScratch={handleStartFromScratch}
          onSelectTemplate={handleSelectTemplateFromDialog}
        />
        
        <ChatbotFormHeader isEditing={isEditing} />

        {isEditing && (
          <DocumentNavigation chatbotId={id || ""} />
        )}

        <form onSubmit={onSubmitForm} className="text-left">
          <ChatbotFormTabs 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            form={form}
            aiProvider={aiProvider}
            isEditing={isEditing}
            selectedTemplateId={selectedTemplateId}
            chatbotId={id}
            userId={user?.id}
            handleNestedChange={handleNestedChange}
            handleChange={handleChange}
            handleProviderChange={handleProviderChange}
            handleTemplateSelect={handleTemplateSelect}
            handleStartFromScratch={handleStartFromScratch}
          />
          
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
