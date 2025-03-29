
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
  Button, Input, Label, Tabs, TabsContent, TabsList, TabsTrigger, 
  Separator, Avatar, AvatarFallback, AvatarImage
} from "@/components/ui/index";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Shield, UserCog, Settings, Key, BellRing, Trash2 } from "lucide-react";

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account and update your preferences.
            </p>
          </div>
          <Settings className="h-8 w-8 text-primary/60" />
        </div>
        
        <Separator className="my-6" />
        
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
            <Card className="border-none shadow-md bg-gradient-to-br from-card to-card/80">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-primary" />
                  User Profile
                </CardTitle>
                <CardDescription>
                  Update your profile information and how it appears on the platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="flex items-center gap-x-6">
                  <Avatar className="h-20 w-20 ring-2 ring-primary/20 ring-offset-2">
                    <AvatarImage src={user?.profileImageUrl} alt={formData.businessName || user?.email || "User"} />
                    <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Profile Picture</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Your avatar appears on your profile page and in your comments.
                    </p>
                    <Button variant="outline" disabled size="sm" className="rounded-full">
                      Change avatar
                    </Button>
                  </div>
                </div>
                
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="businessName" className="text-sm font-medium">Business or company name</Label>
                      <Input 
                        id="businessName"
                        name="businessName"
                        value={formData.businessName} 
                        onChange={handleChange} 
                        placeholder="Your business"
                        className="border-primary/20 focus-visible:ring-primary/30"
                      />
                      <p className="text-xs text-muted-foreground">
                        This name will be visible to all users and appears across the platform.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                      <Input 
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled
                        className="bg-muted/50"
                      />
                      <p className="text-xs text-muted-foreground">
                        Your email cannot be changed.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit"
                      disabled={isUpdating}
                      className="rounded-full px-8"
                    >
                      {isUpdating ? 'Saving...' : 'Save changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account" className="space-y-6 mt-4">
            <Card className="border-none shadow-md bg-gradient-to-br from-card to-card/80">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Account Settings
                </CardTitle>
                <CardDescription>
                  Manage your account preferences and security options.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="bg-accent/30 p-6 rounded-xl space-y-3 border border-accent/50">
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Change password</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Update your password to keep your account secure. We recommend using a strong, unique password.
                  </p>
                  <div>
                    <Button variant="outline" disabled className="rounded-full mt-2">
                      Change password
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="bg-accent/30 p-6 rounded-xl space-y-3 border border-accent/50">
                  <div className="flex items-center gap-3">
                    <BellRing className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Notifications</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your current time zone is set to: <span className="font-medium">Europe/Madrid</span>
                  </p>
                  <div>
                    <Button variant="outline" disabled className="rounded-full mt-2">
                      Update preferences
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-destructive/20 shadow-md bg-gradient-to-br from-card to-card/80">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Actions that will permanently affect your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Delete account</h3>
                  <p className="text-sm text-muted-foreground">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="destructive" disabled className="rounded-full">
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
