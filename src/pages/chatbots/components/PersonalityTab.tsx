
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ChatbotFormData } from "../types";

interface PersonalityTabProps {
  form: ChatbotFormData;
  handleNestedChange: (parent: string, field: string, value: any) => void;
}

const PersonalityTab: React.FC<PersonalityTabProps> = ({ form, handleNestedChange }) => {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Personality & Behavior</CardTitle>
        <CardDescription>
          Define how your chatbot communicates with users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="tone" className="text-left block">Tone</Label>
            <Select
              value={form.personality.tone}
              onValueChange={(value) => handleNestedChange("personality", "tone", value)}
            >
              <SelectTrigger id="tone" className="max-w-xs">
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="style" className="text-left block">Communication Style</Label>
            <Select
              value={form.personality.style}
              onValueChange={(value) => handleNestedChange("personality", "style", value)}
            >
              <SelectTrigger id="style" className="max-w-xs">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concise">Concise</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="helpful">Helpful</SelectItem>
                <SelectItem value="empathetic">Empathetic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2 max-w-md">
          <Label htmlFor="language" className="text-left block">Primary Language</Label>
          <Select
            value={form.personality.language}
            onValueChange={(value) => handleNestedChange("personality", "language", value)}
          >
            <SelectTrigger id="language" className="max-w-xs">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="spanish">Spanish</SelectItem>
              <SelectItem value="french">French</SelectItem>
              <SelectItem value="german">German</SelectItem>
              <SelectItem value="chinese">Chinese</SelectItem>
              <SelectItem value="japanese">Japanese</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2 max-w-2xl">
          <Label htmlFor="greeting" className="text-left block">Initial Greeting</Label>
          <Textarea
            id="greeting"
            placeholder="Hello! I'm a virtual assistant. How can I help you today?"
            rows={3}
            value={form.personality.greeting}
            onChange={(e) => handleNestedChange("personality", "greeting", e.target.value)}
            className="max-w-2xl"
          />
          <p className="text-xs text-muted-foreground text-left">
            The first message users will see when starting a conversation with your chatbot
          </p>
        </div>
        
        <Separator />
        
        <div className="space-y-2 max-w-2xl">
          <Label htmlFor="instructions" className="text-left block">Custom Instructions</Label>
          <Textarea
            id="instructions"
            placeholder="Provide specific instructions for how the chatbot should respond..."
            rows={5}
            value={form.personality.instructions}
            onChange={(e) => handleNestedChange("personality", "instructions", e.target.value)}
            className="max-w-2xl"
          />
          <p className="text-xs text-muted-foreground text-left">
            Additional instructions to guide your chatbot's behavior. For example: "Always greet users by name when possible" or "Provide step-by-step instructions for technical issues"
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalityTab;
