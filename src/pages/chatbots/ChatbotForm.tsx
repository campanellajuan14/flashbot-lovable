import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const ChatbotForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    isActive: true,
    personality: {
      tone: "professional",
      style: "concise",
      language: "english",
      instructions: ""
    },
    settings: {
      model: "gpt-4o",
      temperature: 0.7,
      maxTokens: 2048,
      includeReferences: true
    }
  });
  
  const handleChange = (field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleNestedChange = (parent: string, field: string, value: any) => {
    setForm(prev => {
      // Ensure the parent property exists and is an object before spreading it
      const parentValue = prev[parent as keyof typeof prev];
      if (typeof parentValue === 'object' && parentValue !== null) {
        return {
          ...prev,
          [parent]: {
            ...parentValue,
            [field]: value
          }
        };
      }
      return prev;
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Chatbot created",
        description: `${form.name} has been created successfully.`,
      });
      
      navigate("/chatbots");
    } catch (error) {
      console.error("Error creating chatbot:", error);
      toast({
        variant: "destructive",
        title: "Failed to create chatbot",
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Chatbot</h1>
            <p className="text-muted-foreground">
              Configure your chatbot's personality and behavior
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="personality">Personality</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 pt-4">
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
            </TabsContent>
            
            <TabsContent value="personality" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personality & Behavior</CardTitle>
                  <CardDescription>
                    Define how your chatbot communicates with users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tone">Tone</Label>
                      <Select
                        value={form.personality.tone}
                        onValueChange={(value) => handleNestedChange("personality", "tone", value)}
                      >
                        <SelectTrigger id="tone">
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
                      <Label htmlFor="style">Communication Style</Label>
                      <Select
                        value={form.personality.style}
                        onValueChange={(value) => handleNestedChange("personality", "style", value)}
                      >
                        <SelectTrigger id="style">
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="language">Primary Language</Label>
                    <Select
                      value={form.personality.language}
                      onValueChange={(value) => handleNestedChange("personality", "language", value)}
                    >
                      <SelectTrigger id="language">
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
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="instructions">Custom Instructions</Label>
                    <Textarea
                      id="instructions"
                      placeholder="Provide specific instructions for how the chatbot should respond..."
                      rows={5}
                      value={form.personality.instructions}
                      onChange={(e) => handleNestedChange("personality", "instructions", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Additional instructions to guide your chatbot's behavior. For example: "Always greet users by name when possible" or "Provide step-by-step instructions for technical issues"
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
                  <CardDescription>
                    Configure technical parameters for your chatbot
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                        <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The AI model determines the quality and capabilities of your chatbot
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
                        value={form.settings.maxTokens.toString()}
                        onValueChange={(value) => handleNestedChange("settings", "maxTokens", parseInt(value))}
                      >
                        <SelectTrigger id="maxTokens">
                          <SelectValue placeholder="Select length" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1024">Short (1024 tokens)</SelectItem>
                          <SelectItem value="2048">Medium (2048 tokens)</SelectItem>
                          <SelectItem value="4096">Long (4096 tokens)</SelectItem>
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
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate("/chatbots")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Chatbot
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ChatbotForm;
