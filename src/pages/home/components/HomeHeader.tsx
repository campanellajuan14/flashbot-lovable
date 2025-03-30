
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

interface HomeHeaderProps {
  isScrolled: boolean;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ isScrolled }) => {
  return (
    <header
      className={`sticky top-0 z-40 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200 ${
        isScrolled ? "bg-background/95 shadow-sm" : "bg-transparent border-transparent"
      }`}
    >
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <div className="flex gap-2 items-center">
          <Zap className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Flashbot</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/auth/signin"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Login
          </Link>
          <Button size="sm" className="shadow-md hover:shadow-lg transition-all" asChild>
            <Link to="/chatbots/new">Create free bot</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default HomeHeader;
