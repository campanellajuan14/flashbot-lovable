
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { AuthUser } from "@/hooks/useAuth";

interface DashboardHeaderProps {
  user: AuthUser | null;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user }) => {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          ¡Bienvenido, {user?.businessName || "usuario"}! Aquí tienes un resumen de tus chatbots.
        </p>
      </div>
      <Button asChild className="shrink-0">
        <Link to="/chatbots/new">
          <Plus className="mr-2 h-4 w-4" />
          Crear Chatbot
        </Link>
      </Button>
    </div>
  );
};

export default DashboardHeader;
