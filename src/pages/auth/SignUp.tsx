
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { MessageSquare, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    if (!email || !password || !businessName) {
      toast({
        variant: "destructive",
        title: "Campos obligatorios",
        description: "Por favor, completa todos los campos."
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Contraseña muy corta",
        description: "La contraseña debe tener al menos 6 caracteres."
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await signUp(email, password, businessName);
      // No need to navigate here as the useEffect will handle it when isAuthenticated changes
    } catch (error: any) {
      console.error("Error de registro:", error);
      
      let errorMessage = "No se pudo crear la cuenta. Intenta nuevamente.";
      
      // Check for specific error messages
      if (error.message?.includes("already registered")) {
        errorMessage = "Este email ya está registrado. Por favor, usa otro o inicia sesión.";
      }
      
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center">
            <MessageSquare className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mt-2 text-3xl font-bold">ChatSimp</h2>
          <p className="mt-1 text-muted-foreground">Crea tu cuenta</p>
        </div>
        
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Registro</CardTitle>
              <CardDescription>
                Crea una nueva cuenta para empezar a usar ChatSimp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Nombre de tu Negocio</Label>
                <Input
                  id="businessName"
                  placeholder="Nombre de tu Negocio"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu.email@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  La contraseña debe tener al menos 6 caracteres.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  "Crear Cuenta"
                )}
              </Button>
              <div className="text-center text-sm">
                ¿Ya tienes una cuenta?{" "}
                <Link to="/sign-in" className="text-primary hover:underline">
                  Iniciar sesión
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;
