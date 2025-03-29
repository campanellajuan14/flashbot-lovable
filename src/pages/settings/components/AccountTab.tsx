
import React from "react";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
  Button, Separator
} from "@/components/ui/index";
import { Shield, Key, BellRing, Trash2 } from "lucide-react";

const AccountTab: React.FC = () => {
  return (
    <>
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
    </>
  );
};

export default AccountTab;
