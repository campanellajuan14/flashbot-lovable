
import { 
  createContext, 
  useContext,
  useState, 
  useEffect, 
  ReactNode 
} from 'react';
import { useToast } from "@/components/ui/use-toast";

// Define the User type
export interface User {
  id: string;
  email: string;
  businessName?: string;
  role: 'admin' | 'user';
  profileImageUrl?: string;
}

// Define the context type
interface AuthContextType {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = () => {
      const storedUser = localStorage.getItem('chatsimp-user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          localStorage.removeItem('chatsimp-user');
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  // Sign in function (Mock implementation for now)
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // In a real app, this would call an API
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, we're creating a mock user
      const mockUser: User = {
        id: '123456',
        email,
        businessName: email.split('@')[0] + "'s Business",
        role: 'admin',
      };
      
      // Save user to local storage and state
      localStorage.setItem('chatsimp-user', JSON.stringify(mockUser));
      setUser(mockUser);
      
      toast({
        title: "Signed in successfully",
        description: `Welcome back, ${mockUser.email}!`,
      });
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        variant: "destructive",
        title: "Authentication failed",
        description: "Please check your credentials and try again.",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up function (Mock implementation for now)
  const signUp = async (email: string, password: string, businessName: string) => {
    setIsLoading(true);
    
    try {
      // In a real app, this would call an API
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, we're creating a mock user
      const mockUser: User = {
        id: '123456',
        email,
        businessName,
        role: 'admin',
      };
      
      // Save user to local storage and state
      localStorage.setItem('chatsimp-user', JSON.stringify(mockUser));
      setUser(mockUser);
      
      toast({
        title: "Account created successfully",
        description: `Welcome to ChatSimp, ${businessName}!`,
      });
    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: "Please try again later.",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = () => {
    localStorage.removeItem('chatsimp-user');
    setUser(null);
    toast({
      title: "Signed out successfully",
      description: "You have been signed out of your account.",
    });
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
