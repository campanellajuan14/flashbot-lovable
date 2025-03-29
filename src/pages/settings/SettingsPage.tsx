
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DashboardLayout from "@/components/layout/DashboardLayout";

interface ProfileFormData {
  businessName: string;
  email: string;
}

const SettingsPage = () => {
  const { user, isLoading } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    businessName: "",
    email: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  
  useEffect(() => {
    if (user) {
      setFormData({
        businessName: user.businessName || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ business_name: formData.businessName })
        .eq("id", user.id);
      
      if (error) throw error;
      
      toast.success("Profile updated", {
        description: "Your information has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile", {
        description: "Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const initials = user?.email 
    ? user.email.substring(0, 2).toUpperCase() 
    : "US";

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
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and update your preferences.
          </p>
        </div>
        <Separator className="my-6" />
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>User Profile</CardTitle>
                <CardDescription>
                  Update your profile information and how it appears on the platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-x-6">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.profileImageUrl} alt={formData.businessName || user?.email || "User"} />
                    <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Avatar</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Your avatar appears on your profile page and in your comments.
                    </p>
                    <Button variant="outline" disabled size="sm">
                      Change avatar
                    </Button>
                  </div>
                </div>
                
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business name</Label>
                      <Input 
                        id="businessName"
                        name="businessName"
                        value={formData.businessName} 
                        onChange={handleChange} 
                        placeholder="Your business"
                      />
                      <p className="text-xs text-muted-foreground">
                        This name will be visible to all users.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled
                      />
                      <p className="text-xs text-muted-foreground">
                        Your email cannot be changed.
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit"
                    disabled={isUpdating}
                    className="mt-4"
                  >
                    {isUpdating ? 'Saving...' : 'Save changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences and security options.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Change password</h3>
                  <p className="text-sm text-muted-foreground">
                    Update your password to keep your account secure.
                  </p>
                  <Button variant="outline" disabled>
                    Change password
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Time zone</h3>
                  <p className="text-sm text-muted-foreground">
                    Your current time zone is set to: <span className="font-medium">Europe/Madrid</span>
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Actions that will permanently affect your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Delete account</h3>
                  <p className="text-sm text-muted-foreground">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="destructive" disabled>
                  Delete account
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
