
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserButton } from "@/components/auth/UserButton";
import { useAuth } from "@/hooks/useAuth";
import { Zap } from "lucide-react";

interface HeaderProps {
  isScrolled?: boolean;
  variant?: "default" | "home";
}

const Header = ({ isScrolled = false, variant = "default" }: HeaderProps) => {
  const { isAuthenticated } = useAuth();
  
  const isHomeVariant = variant === "home";
  
  return (
    <header
      className={`${isHomeVariant ? 'sticky top-0 z-40' : ''} w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200 ${
        isScrolled || !isHomeVariant 
          ? "bg-background/95 shadow-sm" 
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="container mx-auto px-6 lg:px-8 flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Flashbot</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Button 
                variant="ghost" 
                asChild 
                size={isHomeVariant ? "sm" : "default"}
                className="flex"
              >
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <UserButton />
            </>
          ) : (
            <div className="flex gap-4">
              <Link
                to="/signin"
                className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Login
              </Link>
              <Button size={isHomeVariant ? "sm" : "default"} 
                className={isHomeVariant ? "shadow-md hover:shadow-lg transition-all" : ""} 
                asChild
              >
                <Link to="/signup">
                  {isHomeVariant ? "Build your chatbot" : "Create free bot"}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
