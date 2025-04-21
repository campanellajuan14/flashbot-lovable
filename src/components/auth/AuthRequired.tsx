
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const AuthRequired = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // While checking auth state, show nothing or a loading indicator
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }

  // If not authenticated, redirect to sign-in page
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

export default AuthRequired;
