
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BasicInfoTab from "./BasicInfoTab";
import PersonalityTab from "./PersonalityTab";
import AdvancedSettingsTab from "./AdvancedSettingsTab";
import TemplateSelectionTab from "./TemplateSelectionTab";
import { ChatbotFormData } from "../types";
import { ChatbotTemplate } from "../templates/types";

interface ChatbotFormTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  form: ChatbotFormData;
  aiProvider: "claude" | "openai";
  isEditing: boolean;
  selectedTemplateId: string | null;
  chatbotId?: string;
  userId?: string;
  handleNestedChange: (parent: string, field: string, value: any) => void;
  handleChange: (field: string, value: any) => void;
  handleProviderChange: (provider: "claude" | "openai") => void;
  handleTemplateSelect: (template: ChatbotTemplate) => void;
  handleStartFromScratch: (e?: React.MouseEvent) => void;
}

const ChatbotFormTabs = ({ 
  activeTab,
  setActiveTab,
  form,
  aiProvider,
  isEditing,
  selectedTemplateId,
  chatbotId,
  userId,
  handleNestedChange,
  handleChange,
  handleProviderChange,
  handleTemplateSelect,
  handleStartFromScratch
}: ChatbotFormTabsProps) => {
  // Handle tab change 
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
      <TabsList className="w-full grid grid-cols-2 mb-2">
        <TabsTrigger value="basic" type="button">Basic Information</TabsTrigger>
        <TabsTrigger value="advanced" type="button">Advanced Settings</TabsTrigger>
      </TabsList>
      
      {/* Templates tab is now hidden by default but can still be accessed */}
      {!isEditing && (
        <TabsContent value="templates" className="pt-4">
          <TemplateSelectionTab 
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={handleTemplateSelect}
            onStartFromScratch={handleStartFromScratch}
          />
        </TabsContent>
      )}
      
      <TabsContent value="basic" className="pt-4">
        <BasicInfoTab 
          form={form} 
          handleChange={handleChange}
          handleNestedChange={handleNestedChange}
          chatbotId={chatbotId}
          userId={userId}
        />
      </TabsContent>
      
      <TabsContent value="advanced" className="pt-4">
        <AdvancedSettingsTab 
          form={form} 
          aiProvider={aiProvider}
          handleNestedChange={handleNestedChange}
          handleProviderChange={handleProviderChange}
        />
      </TabsContent>
    </Tabs>
  );
};

export default ChatbotFormTabs;
