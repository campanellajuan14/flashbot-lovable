
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

// Pages
import Index from "./pages/Index";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import Dashboard from "./pages/dashboard/Dashboard";
import ChatbotList from "./pages/chatbots/ChatbotList";
import ChatbotForm from "./pages/chatbots/ChatbotForm";
import ChatbotPreview from "./pages/chatbots/ChatbotPreview";
import ChatbotDocuments from "./pages/chatbots/ChatbotDocuments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/chatbots" element={
              <ProtectedRoute>
                <ChatbotList />
              </ProtectedRoute>
            } />
            
            <Route path="/chatbots/new" element={
              <ProtectedRoute>
                <ChatbotForm />
              </ProtectedRoute>
            } />
            
            <Route path="/chatbots/:id" element={
              <ProtectedRoute>
                <ChatbotForm />
              </ProtectedRoute>
            } />
            
            {/* Preview no necesita autenticación para que puedas compartir con usuarios */}
            <Route path="/chatbots/:id/preview" element={<ChatbotPreview />} />
            
            {/* Ruta a documentos - asegurarnos que esté protegida */}
            <Route path="/chatbots/:id/documents" element={
              <ProtectedRoute>
                <ChatbotDocuments />
              </ProtectedRoute>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
