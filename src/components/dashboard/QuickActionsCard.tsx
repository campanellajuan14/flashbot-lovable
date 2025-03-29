
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

const QuickActionsCard: React.FC = () => {
  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common tasks and shortcuts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Button className="w-full justify-start" variant="outline" asChild>
            <Link to="/chatbots/new">
              <Plus className="mr-2 h-4 w-4" />
              New Chatbot
            </Link>
          </Button>
          <Button className="w-full justify-start" variant="outline" asChild>
            <Link to="/documents/upload">
              <Plus className="mr-2 h-4 w-4" />
              Upload Documents
            </Link>
          </Button>
          <Button className="w-full justify-start" variant="outline" asChild>
            <Link to="/settings/integrations">
              <Plus className="mr-2 h-4 w-4" />
              Connect Integration
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsCard;
