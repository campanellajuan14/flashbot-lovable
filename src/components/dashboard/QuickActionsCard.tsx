
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

const QuickActionsCard: React.FC = () => {
  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle>Acciones Rápidas</CardTitle>
        <CardDescription>
          Tareas y accesos directos comunes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Button className="w-full justify-start" variant="outline" asChild>
            <Link to="/chatbots/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Chatbot
            </Link>
          </Button>
          <Button className="w-full justify-start" variant="outline" asChild>
            <Link to="/documents/upload">
              <Plus className="mr-2 h-4 w-4" />
              Subir Documentos
            </Link>
          </Button>
          <Button className="w-full justify-start" variant="outline" asChild>
            <Link to="/settings/integrations">
              <Plus className="mr-2 h-4 w-4" />
              Conectar Integración
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsCard;
