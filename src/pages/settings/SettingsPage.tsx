
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/index";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { UserCog, Shield } from "lucide-react";

import SettingsHeader from "./components/SettingsHeader";
import ProfileTab from "./components/ProfileTab";
import AccountTab from "./components/AccountTab";

const SettingsPage = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 container py-6 max-w-4xl mx-auto">
        <SettingsHeader 
          title="Settings"
          description="Manage your account and update your preferences."
        />
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Account</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6 mt-4">
            <ProfileTab />
          </TabsContent>
          
          <TabsContent value="account" className="space-y-6 mt-4">
            <AccountTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
