
import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";

import DocumentNavigation from "@/components/chatbots/DocumentNavigation";
import InitialChoiceDialog from "./components/InitialChoiceDialog";
import { useChatbotForm } from "./hooks/useChatbotForm";
import LoadingState from "./components/LoadingState";
import { getTemplateById } from "./templates/data";
import ChatbotFormHeader from "./components/ChatbotFormHeader";
import FormActions from "./components/FormActions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BasicInfoTab from "./components/BasicInfoTab";
import AdvancedSettingsTab from "./components/AdvancedSettingsTab";
import ShareSettings from "@/components/chatbots/ShareSettings";
import { Separator } from "@/components/ui/separator";
import { InfoIcon, Settings, Share } from "lucide-react";

const ChatbotForm = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  
  // Get tab from URL query parameter or default to "basic"
  const getInitialTab = () => {
    const queryParams = new URLSearchParams(location.search);
    const tabParam = queryParams.get('tab');
    return tabParam === 'basic' || tabParam === 'advanced' || tabParam === 'share' 
      ? tabParam 
      : 'basic';
  };
  
  const [activeTab, setActiveTab] = useState<string>(getInitialTab());
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

  // Update active tab when URL query parameter changes
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.search]);

  // Ensure we prevent default and stop propagation
  const handleStartFromScratch = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowInitialDialog(false);
    setActiveTab("basic");
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
      setActiveTab("basic");
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

  // Explicit function to handle form submission with prevent default
  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(form); // Pass the form object to handleSubmit
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

        {isEditing && id && (
          <DocumentNavigation chatbotId={id} />
        )}

        <form onSubmit={onSubmitForm} className="text-left">
          <Tabs 
            defaultValue="basic" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <InfoIcon className="h-4 w-4" />
                <span>Basic Information</span>
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Advanced Settings</span>
              </TabsTrigger>
              <TabsTrigger value="share" className="flex items-center gap-2">
                <Share className="h-4 w-4" />
                <span>Share/Embed</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <BasicInfoTab
                form={form}
                handleChange={handleChange}
                handleNestedChange={handleNestedChange}
                chatbotId={id}
                userId={user?.id}
              />
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <AdvancedSettingsTab
                form={form}
                aiProvider={aiProvider}
                handleNestedChange={handleNestedChange}
                handleProviderChange={handleProviderChange}
              />

              {isEditing && id && (
                <>
                  <Separator className="my-4" />
                  <div className="mt-4">
                    <h2 className="text-xl font-semibold mb-4">WhatsApp Integration</h2>
                    {/* Add WhatsApp integration settings here if needed */}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="share" className="space-y-6">
              {isEditing && id ? (
                <ShareSettings />
              ) : (
                <div className="p-6 bg-muted/20 rounded-lg text-center">
                  <h3 className="text-lg font-medium mb-2">Save your chatbot first</h3>
                  <p className="text-muted-foreground">
                    You need to save your chatbot before configuring sharing options.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
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
