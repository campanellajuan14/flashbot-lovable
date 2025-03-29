
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserButton } from "@/components/auth/UserButton";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare } from "lucide-react";

const Header = () => {
  const { isAuthenticated } = useAuth();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ChatSimp</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <nav className="hidden md:flex gap-4">
                <Link to="/dashboard" className="text-foreground/80 hover:text-foreground transition-colors">
                  Dashboard
                </Link>
                <Link to="/chatbots" className="text-foreground/80 hover:text-foreground transition-colors">
                  Chatbots
                </Link>
                <Link to="/docs" className="text-foreground/80 hover:text-foreground transition-colors">
                  Documentation
                </Link>
              </nav>
              <UserButton />
            </>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" asChild>
                <Link to="/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/sign-up">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
