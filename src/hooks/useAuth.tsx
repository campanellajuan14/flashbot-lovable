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
  hasMfa: boolean;
}

// Define the context type
interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, businessName: string) => Promise<void>;
  signOut: () => void;
  // MFA functions
  enrollMfa: () => Promise<{ qr: string; secret: string }>;
  verifyMfa: (code: string) => Promise<boolean>;
  unenrollMfa: () => Promise<boolean>;
  getMfaFactors: () => Promise<any[]>;
  // Check if MFA is required for this account
  isMfaRequired: () => boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Function to check if MFA is required (admin users always require MFA)
  const isMfaRequired = () => {
    if (!user) return false;
    // Admins are required to have MFA
    return user.role === 'admin';
  };
  
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
            hasMfa: false, // Will be updated with actual value
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
              // Get user profile data
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('business_name, role')
                .eq('id', session.user.id)
                .maybeSingle();
                
              if (profileError) {
                console.error('Error fetching profile:', profileError);
                return;
              }
              
              // Get MFA factors to check if user has MFA enabled
              const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
              
              if (factorsError) {
                console.error('Error fetching MFA factors:', factorsError);
              }
              
              const hasMfa = factorsData?.totp?.length > 0 && 
                             factorsData.totp.some(factor => factor.status === 'verified');
              
              if (profileData) {
                setUser(prev => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    businessName: profileData.business_name || prev.businessName,
                    role: (profileData.role as 'admin' | 'user') || prev.role,
                    hasMfa,
                  };
                });
                
                // If user is admin and doesn't have MFA, log security warning
                const isAdmin = profileData.role === 'admin';
                if (isAdmin && !hasMfa) {
                  console.warn('Admin user does not have MFA enabled');
                  
                  // Warn the user to enable MFA
                  sonnerToast.warning("Configuración de seguridad recomendada", {
                    description: "Como administrador, recomendamos activar la autenticación de dos factores (2FA).",
                    duration: 8000,
                  });
                }
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
          hasMfa: false, // Will be updated with actual value
        };
        
        console.log("Setting initial user:", authUser);
        setUser(authUser);
        
        // Use setTimeout for additional data fetch
        setTimeout(async () => {
          try {
            // Get user profile data
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('business_name, role')
              .eq('id', session.user.id)
              .maybeSingle();
              
            if (profileError) {
              console.error('Error fetching profile:', profileError);
              return;
            }
            
            // Get MFA factors to check if user has MFA enabled
            const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
            
            if (factorsError) {
              console.error('Error fetching MFA factors:', factorsError);
            }
            
            const hasMfa = factorsData?.totp?.length > 0 && 
                           factorsData.totp.some(factor => factor.status === 'verified');
            
            if (profileData) {
              setUser(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  businessName: profileData.business_name || prev.businessName,
                  role: (profileData.role as 'admin' | 'user') || prev.role,
                  hasMfa,
                };
              });
              
              // If user is admin and doesn't have MFA, log security warning
              const isAdmin = profileData.role === 'admin';
              if (isAdmin && !hasMfa) {
                console.warn('Admin user does not have MFA enabled');
                
                // Warn the user to enable MFA
                sonnerToast.warning("Configuración de seguridad recomendada", {
                  description: "Como administrador, recomendamos activar la autenticación de dos factores (2FA).",
                  duration: 8000,
                });
              }
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
  
  // Enroll in MFA
  const enrollMfa = async (): Promise<{ qr: string; secret: string }> => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      });
      
      if (error) throw error;
      
      return {
        qr: data.totp.qr_code,
        secret: data.totp.secret
      };
    } catch (error: any) {
      console.error('Error enrolling in MFA:', error);
      sonnerToast.error("Error MFA", {
        description: error.message || "No se pudo configurar la autenticación de dos factores.",
      });
      throw error;
    }
  };
  
  // Verify MFA code after enrollment
  const verifyMfa = async (code: string): Promise<boolean> => {
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (!factors.totp || factors.totp.length === 0) {
        throw new Error('No MFA factors found');
      }
      
      // Get the first factor 
      const factorId = factors.totp[0].id;
      
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId
      });
      
      if (error) throw error;
      
      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: data.id,
        code
      });
      
      if (verifyError) throw verifyError;
      
      // Update user state to reflect MFA status
      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          hasMfa: true
        };
      });
      
      sonnerToast.success("MFA activado", {
        description: "La autenticación de dos factores se ha configurado correctamente.",
      });
      
      return true;
    } catch (error: any) {
      console.error('Error verifying MFA:', error);
      sonnerToast.error("Error de verificación", {
        description: error.message || "El código de verificación es incorrecto o ha expirado.",
      });
      return false;
    }
  };
  
  // Unenroll from MFA
  const unenrollMfa = async (): Promise<boolean> => {
    try {
      // Get the list of factors first
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) throw factorsError;
      
      if (!factors.totp || factors.totp.length === 0) {
        throw new Error('No MFA factors found to unenroll');
      }
      
      // Unenroll each factor
      for (const factor of factors.totp) {
        if (factor.status === 'verified') {
          const { error } = await supabase.auth.mfa.unenroll({
            factorId: factor.id
          });
          
          if (error) throw error;
        }
      }
      
      // Update user state to reflect MFA status
      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          hasMfa: false
        };
      });
      
      sonnerToast.success("MFA desactivado", {
        description: "La autenticación de dos factores se ha desactivado correctamente.",
      });
      
      return true;
    } catch (error: any) {
      console.error('Error unenrolling MFA:', error);
      sonnerToast.error("Error", {
        description: error.message || "No se pudo desactivar la autenticación de dos factores.",
      });
      return false;
    }
  };
  
  // Get MFA factors
  const getMfaFactors = async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) throw error;
      
      return data.totp || [];
    } catch (error: any) {
      console.error('Error getting MFA factors:', error);
      return [];
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
        enrollMfa,
        verifyMfa,
        unenrollMfa,
        getMfaFactors,
        isMfaRequired
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
