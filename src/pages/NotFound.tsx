
import React from "react";
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-xl text-muted-foreground mb-6">Oops! This page doesn't exist</p>
      <p className="text-base text-muted-foreground max-w-md text-center mb-8">
        The page you're looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Button size="lg" asChild>
        <Link to="/">
          <Home className="mr-2 h-4 w-4" />
          Return to Home
        </Link>
      </Button>
    </div>
  );
};

export default NotFound;
