
import { 
  createContext, 
  useContext,
  useState, 
  useEffect, 
  ReactNode 
} from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";
import { Session, User } from '@supabase/supabase-js';

// Define the User type
export interface AuthUser {
  id: string;
  email: string;
  businessName?: string;
  role: 'admin' | 'user';
  profileImageUrl?: string;
}

// Define the context type
interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, businessName: string) => Promise<void>;
  signOut: () => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Setup auth state listener
  useEffect(() => {
    console.log("Setting up auth listener");
    setIsLoading(true);
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        
        // Use simple synchronous state updates in the callback
        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            businessName: session.user.user_metadata?.business_name || '',
            role: 'user',
          };
          
          console.log("Setting user from auth event:", authUser);
          setUser(authUser);
        } else {
          setUser(null);
        }
        
        // Use setTimeout to defer any additional Supabase calls
        if (session?.user) {
          setTimeout(async () => {
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('business_name, role')
                .eq('id', session.user.id)
                .maybeSingle();
                
              if (profileError) {
                console.error('Error fetching profile:', profileError);
                return;
              }
              
              if (profileData) {
                setUser(prev => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    businessName: profileData.business_name || prev.businessName,
                    role: (profileData.role as 'admin' | 'user') || prev.role,
                  };
                });
              }
            } catch (error) {
              console.error('Error fetching additional user data:', error);
            }
          }, 0);
        }
      }
    );
    
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session?.user?.id);
      
      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          businessName: session.user.user_metadata?.business_name || '',
          role: 'user',
        };
        
        console.log("Setting initial user:", authUser);
        setUser(authUser);
        
        // Use setTimeout for additional data fetch
        setTimeout(async () => {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('business_name, role')
              .eq('id', session.user.id)
              .maybeSingle();
              
            if (profileError) {
              console.error('Error fetching profile:', profileError);
              return;
            }
            
            if (profileData) {
              setUser(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  businessName: profileData.business_name || prev.businessName,
                  role: (profileData.role as 'admin' | 'user') || prev.role,
                };
              });
            }
          } catch (error) {
            console.error('Error fetching additional user data:', error);
          } finally {
            setIsLoading(false);
          }
        }, 0);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    }).catch(error => {
      console.error("Error checking session:", error);
      setUser(null);
      setIsLoading(false);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      console.log("Signing in with:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      console.log("Sign in successful:", data);
      
      sonnerToast.success("Inicio de sesión exitoso", {
        description: `¡Bienvenido de nuevo, ${email}!`,
      });
      
      // No explicit return needed, the auth state change will trigger the onAuthStateChange listener
    } catch (error: any) {
      console.error('Error de inicio de sesión:', error);
      sonnerToast.error("Fallo en la autenticación", {
        description: error.message || "Por favor verifica tus credenciales e intenta nuevamente.",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, businessName: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      console.log("Signing up with:", email, businessName);
      
      // Register the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            business_name: businessName,
          }
        }
      });
      
      if (error) throw error;
      
      console.log("Sign up successful:", data);
      
      sonnerToast.success("Cuenta creada con éxito", {
        description: `¡Bienvenido a ChatSimp, ${businessName}!`,
      });
      
      // No explicit return needed, the auth state change will trigger the onAuthStateChange listener
    } catch (error: any) {
      console.error('Error de registro:', error);
      sonnerToast.error("Fallo en el registro", {
        description: error.message || "Por favor intenta nuevamente más tarde.",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      sonnerToast.success("Sesión cerrada", {
        description: "Has cerrado sesión exitosamente.",
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      sonnerToast.error("Error", {
        description: "No se pudo cerrar sesión. Intenta nuevamente.",
      });
    }
  };
  
  console.log("Auth state:", { user, isAuthenticated: !!user, isLoading });

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
