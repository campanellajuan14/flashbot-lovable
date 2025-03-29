
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
      
      toast.success("Perfil actualizado", {
        description: "Tu información ha sido actualizada con éxito.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error al actualizar el perfil", {
        description: "Por favor intenta nuevamente.",
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
            <p className="text-muted-foreground">Cargando configuración...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 container py-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground">
            Gestiona tu cuenta y actualiza tus preferencias.
          </p>
        </div>
        <Separator className="my-6" />
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="account">Cuenta</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Perfil de usuario</CardTitle>
                <CardDescription>
                  Actualiza tu información de perfil y cómo aparece en la plataforma.
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
                      Tu avatar aparece en tu página de perfil y en tus comentarios.
                    </p>
                    <Button variant="outline" disabled size="sm">
                      Cambiar avatar
                    </Button>
                  </div>
                </div>
                
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Nombre de empresa</Label>
                      <Input 
                        id="businessName"
                        name="businessName"
                        value={formData.businessName} 
                        onChange={handleChange} 
                        placeholder="Tu empresa"
                      />
                      <p className="text-xs text-muted-foreground">
                        Este nombre será visible para todos los usuarios.
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
                        Tu correo electrónico no puede ser cambiado.
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit"
                    disabled={isUpdating}
                    className="mt-4"
                  >
                    {isUpdating ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de cuenta</CardTitle>
                <CardDescription>
                  Gestiona las preferencias de tu cuenta y opciones de seguridad.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Cambiar contraseña</h3>
                  <p className="text-sm text-muted-foreground">
                    Actualiza tu contraseña para mantener segura tu cuenta.
                  </p>
                  <Button variant="outline" disabled>
                    Cambiar contraseña
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Zona horaria</h3>
                  <p className="text-sm text-muted-foreground">
                    Tu zona horaria actual está configurada como: <span className="font-medium">Europe/Madrid</span>
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Zona de peligro</CardTitle>
                <CardDescription>
                  Acciones irreversibles que afectarán permanentemente a tu cuenta.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Eliminar cuenta</h3>
                  <p className="text-sm text-muted-foreground">
                    Una vez eliminada tu cuenta, no hay vuelta atrás. Por favor, estás seguro.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="destructive" disabled>
                  Eliminar cuenta
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
