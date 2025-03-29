
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { availableModels } from "../constants";

interface AdvancedSettingsTabProps {
  form: {
    settings: {
      model: string;
      temperature: number;
      maxTokens: number;
      includeReferences: boolean;
    }
  };
  aiProvider: "claude" | "openai";
  handleNestedChange: (parent: string, field: string, value: any) => void;
  handleProviderChange: (provider: "claude" | "openai") => void;
}

const AdvancedSettingsTab: React.FC<AdvancedSettingsTabProps> = ({
  form,
  aiProvider,
  handleNestedChange,
  handleProviderChange
}) => {
  // Prevent any unexpected string to number conversion issues
  const currentMaxTokens = form.settings.maxTokens?.toString() || "1000";
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Settings</CardTitle>
        <CardDescription>
          Configure technical parameters for your chatbot
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="provider">AI Provider</Label>
          <Select
            value={aiProvider}
            onValueChange={(value: "claude" | "openai") => handleProviderChange(value)}
          >
            <SelectTrigger id="provider">
              <SelectValue placeholder="Select AI provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude">Anthropic Claude</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Choose the AI provider to power your chatbot
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="model">AI Model</Label>
          <Select
            value={form.settings.model}
            onValueChange={(value) => handleNestedChange("settings", "model", value)}
          >
            <SelectTrigger id="model">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {aiProvider === "claude" ? (
                availableModels.claude.map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name} ({model.description})
                  </SelectItem>
                ))
              ) : (
                availableModels.openai.map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name} ({model.description})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            The AI model determines your chatbot's quality and capabilities
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="temperature">Temperature ({form.settings.temperature})</Label>
            <Input
              id="temperature"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={form.settings.temperature}
              onChange={(e) => handleNestedChange("settings", "temperature", parseFloat(e.target.value))}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maxTokens">Max Response Length</Label>
            <Select
              value={currentMaxTokens}
              onValueChange={(value) => handleNestedChange("settings", "maxTokens", parseInt(value, 10))}
            >
              <SelectTrigger id="maxTokens">
                <SelectValue placeholder="Select length" />
              </SelectTrigger>
              <SelectContent>
                {aiProvider === "claude" ? (
                  <>
                    <SelectItem value="1000">Short (1000 tokens)</SelectItem>
                    <SelectItem value="2000">Medium (2000 tokens)</SelectItem>
                    <SelectItem value="4000">Long (4000 tokens)</SelectItem>
                    <SelectItem value="8192">Very Long (8192 tokens)</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="1024">Short (1024 tokens)</SelectItem>
                    <SelectItem value="2048">Medium (2048 tokens)</SelectItem>
                    <SelectItem value="4096">Long (4096 tokens)</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Separator />
        
        <div className="flex items-center space-x-2">
          <Switch
            id="includeReferences"
            checked={form.settings.includeReferences}
            onCheckedChange={(checked) => handleNestedChange("settings", "includeReferences", checked)}
          />
          <div>
            <Label htmlFor="includeReferences">Include Document References</Label>
            <p className="text-xs text-muted-foreground">
              Show the source documents used to generate responses
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedSettingsTab;
