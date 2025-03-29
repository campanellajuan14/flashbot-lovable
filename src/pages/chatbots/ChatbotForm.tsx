
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Json } from "@/integrations/supabase/types";
import DocumentNavigation from "@/components/chatbots/DocumentNavigation";

interface Personality {
  tone: string;
  style: string;
  language: string;
  instructions: string;
  greeting: string;
}

interface Settings {
  model: string;
  temperature: number;
  maxTokens: number;
  includeReferences: boolean;
}

const defaultPersonality: Personality = {
  tone: "professional",
  style: "concise",
  language: "english",
  instructions: "",
  greeting: "¡Hola! Soy un asistente virtual. ¿En qué puedo ayudarte hoy?"
};

const defaultSettings: Settings = {
  model: "claude-3-haiku-20240307",
  temperature: 0.7,
  maxTokens: 1000,
  includeReferences: true
};

const availableModels = {
  claude: [
    { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", description: "Rápido y económico" },
    { id: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet", description: "Equilibrio entre velocidad y capacidad" },
    { id: "claude-3-opus-20240229", name: "Claude 3 Opus", description: "El más potente" }
  ],
  openai: [
    { id: "gpt-4o", name: "GPT-4o", description: "El más recomendado" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo", description: "Potente y rápido" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "El más rápido" }
  ]
};

const ChatbotForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [form, setForm] = useState({
    name: "",
    description: "",
    isActive: true,
    personality: defaultPersonality,
    settings: defaultSettings
  });
  
  const [aiProvider, setAiProvider] = useState<"claude" | "openai">("claude");

  useEffect(() => {
    if (isEditing && user) {
      setIsLoading(true);
      
      const fetchChatbot = async () => {
        try {
          const { data, error } = await supabase
            .from('chatbots')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();
          
          if (error) throw error;
          
          if (data) {
            let personalityData: Personality = { ...defaultPersonality };
            if (data.behavior && typeof data.behavior === 'object' && !Array.isArray(data.behavior)) {
              const behavior = data.behavior as Record<string, unknown>;
              personalityData = {
                tone: typeof behavior.tone === 'string' ? behavior.tone : defaultPersonality.tone,
                style: typeof behavior.style === 'string' ? behavior.style : defaultPersonality.style,
                language: typeof behavior.language === 'string' ? behavior.language : defaultPersonality.language,
                instructions: typeof behavior.instructions === 'string' ? behavior.instructions : defaultPersonality.instructions,
                greeting: typeof behavior.greeting === 'string' ? behavior.greeting : defaultPersonality.greeting
              };
            }
            
            let settingsData: Settings = { ...defaultSettings };
            if (data.settings && typeof data.settings === 'object' && !Array.isArray(data.settings)) {
              const settings = data.settings as Record<string, unknown>;
              settingsData = {
                model: typeof settings.model === 'string' ? settings.model : defaultSettings.model,
                temperature: typeof settings.temperature === 'number' ? settings.temperature : defaultSettings.temperature,
                maxTokens: typeof settings.maxTokens === 'number' ? settings.maxTokens : defaultSettings.maxTokens,
                includeReferences: typeof settings.includeReferences === 'boolean' ? settings.includeReferences : defaultSettings.includeReferences
              };
            }
            
            setForm({
              name: data.name,
              description: data.description || "",
              isActive: data.is_active,
              personality: personalityData,
              settings: settingsData
            });
            
            if (settingsData.model.includes('claude')) {
              setAiProvider("claude");
            } else {
              setAiProvider("openai");
            }
          }
        } catch (error) {
          console.error("Error fetching chatbot:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo cargar el chatbot",
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchChatbot();
    }
  }, [id, isEditing, user, toast]);
  
  const handleChange = (field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleNestedChange = (parent: string, field: string, value: any) => {
    setForm(prev => {
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
  
  const handleProviderChange = (provider: "claude" | "openai") => {
    setAiProvider(provider);
    const defaultModel = provider === "claude" 
      ? "claude-3-haiku-20240307" 
      : "gpt-4o";
    
    handleNestedChange("settings", "model", defaultModel);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes iniciar sesión para crear un chatbot",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const chatbotData = {
        name: form.name,
        description: form.description,
        is_active: form.isActive,
        behavior: form.personality as unknown as Json,
        settings: form.settings as unknown as Json,
        user_id: user.id
      };
      
      console.log("Saving chatbot with data:", chatbotData);
      
      let result;
      
      if (isEditing) {
        result = await supabase
          .from('chatbots')
          .update(chatbotData)
          .eq('id', id)
          .eq('user_id', user.id);
      } else {
        result = await supabase
          .from('chatbots')
          .insert(chatbotData);
      }
      
      const { error } = result;
      
      if (error) throw error;
      
      toast({
        title: isEditing ? "Chatbot actualizado" : "Chatbot creado",
        description: `${form.name} ha sido ${isEditing ? "actualizado" : "creado"} exitosamente.`,
      });
      
      navigate("/chatbots");
    } catch (error: any) {
      console.error("Error saving chatbot:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar el chatbot. Inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

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
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditing ? "Editar Chatbot" : "Crear Nuevo Chatbot"}
            </h1>
            <p className="text-muted-foreground">
              Configura la personalidad y comportamiento de tu chatbot
            </p>
          </div>
        </div>

        {isEditing && (
          <DocumentNavigation chatbotId={id || ""} />
        )}

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Información Básica</TabsTrigger>
              <TabsTrigger value="personality">Personalidad</TabsTrigger>
              <TabsTrigger value="advanced">Configuración Avanzada</TabsTrigger>
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="greeting">Initial Greeting</Label>
                    <Textarea
                      id="greeting"
                      placeholder="¡Hola! Soy un asistente virtual. ¿En qué puedo ayudarte hoy?"
                      rows={3}
                      value={form.personality.greeting || defaultPersonality.greeting}
                      onChange={(e) => handleNestedChange("personality", "greeting", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The first message users will see when starting a conversation with your chatbot
                    </p>
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
                      Elija el proveedor de IA para alimentar su chatbot
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
                      El modelo de IA determina la calidad y capacidades de su chatbot
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
                          {aiProvider === "claude" ? (
                            <>
                              <SelectItem value="1000">Short (1000 tokens)</SelectItem>
                              <SelectItem value="2000">Medium (2000 tokens)</SelectItem>
                              <SelectItem value="4000">Long (4000 tokens)</SelectItem>
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
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate("/chatbots")}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Actualizando..." : "Creando..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? "Actualizar Chatbot" : "Crear Chatbot"}
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
