
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ChatbotFormData } from "../types";

interface BasicInfoTabProps {
  form: ChatbotFormData;
  handleChange: (field: string, value: any) => void;
}

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({ form, handleChange }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>
          Set up the name and description for your chatbot
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="e.g., Customer Support Assistant"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            A clear and descriptive name for your chatbot
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="What does this chatbot do?"
            rows={3}
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            A brief description of the chatbot's purpose and capabilities
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="active"
            checked={form.isActive}
            onCheckedChange={(checked) => handleChange("isActive", checked)}
          />
          <Label htmlFor="active">Active</Label>
        </div>
      </CardContent>
    </Card>
  );
};

export default BasicInfoTab;
