
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserButton } from "@/components/auth/UserButton";
import { useAuth } from "@/hooks/useAuth";
import { Zap } from "lucide-react";

const Header = () => {
  const { isAuthenticated } = useAuth();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Flashbot</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Button variant="ghost" asChild className="hidden md:flex">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <UserButton />
            </>
          ) : (
            <div className="flex gap-4">
              <Link
                to="/auth/signin"
                className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Login
              </Link>
              <Button asChild>
                <Link to="/chatbots/new">Create free bot</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
