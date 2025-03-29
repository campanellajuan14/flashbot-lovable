
import { 
  createContext, 
  useContext,
  useState, 
  useEffect, 
  ReactNode 
} from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
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

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      
      // Check for an active session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error checking session:', sessionError);
        setIsLoading(false);
        return;
      }
      
      if (session) {
        await handleSession(session);
      }
      
      setIsLoading(false);
      
      // Set up auth state listener
      const { data: { subscription } } = await supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session) {
            await handleSession(session);
          } else {
            setUser(null);
          }
        }
      );
      
      return () => {
        subscription.unsubscribe();
      };
    };
    
    checkSession();
  }, []);
  
  // Helper to process session data
  const handleSession = async (session: Session) => {
    try {
      const supabaseUser = session.user;
      
      // Get profile data from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('business_name, role')
        .eq('id', supabaseUser.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }
      
      // Create the user object
      const authUser: AuthUser = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        businessName: profileData?.business_name || '',
        role: (profileData?.role as 'admin' | 'user') || 'user',
      };
      
      setUser(authUser);
    } catch (error) {
      console.error('Session handling error:', error);
      setUser(null);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido de nuevo, ${email}!`,
      });
    } catch (error: any) {
      console.error('Error de inicio de sesión:', error);
      toast({
        variant: "destructive",
        title: "Fallo en la autenticación",
        description: error.message || "Por favor verifica tus credenciales e intenta nuevamente.",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, businessName: string) => {
    setIsLoading(true);
    
    try {
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
      
      toast({
        title: "Cuenta creada con éxito",
        description: `Bienvenido a ChatSimp, ${businessName}!`,
      });
    } catch (error: any) {
      console.error('Error de registro:', error);
      toast({
        variant: "destructive",
        title: "Fallo en el registro",
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
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente.",
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cerrar sesión. Intenta nuevamente.",
      });
    }
  };

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
