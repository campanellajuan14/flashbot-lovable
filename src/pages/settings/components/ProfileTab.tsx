
import React from "react";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Button, Input, Label, Avatar, AvatarFallback, AvatarImage
} from "@/components/ui/index";
import { UserCog } from "lucide-react";
import { useProfileForm } from "../hooks/useProfileForm";

const ProfileTab: React.FC = () => {
  const { user, formData, isUpdating, handleChange, handleUpdateProfile, initials } = useProfileForm();

  if (!user) return null;
  
  return (
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
  );
};

export default ProfileTab;
