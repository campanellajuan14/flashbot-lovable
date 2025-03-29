
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Plus, Settings } from "lucide-react";
import { AuthUser } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CardVisibility {
  stats: boolean;
  activity: boolean;
  actions: boolean;
}

interface DashboardHeaderProps {
  user: AuthUser | null;
  cardVisibility: CardVisibility;
  onToggleVisibility: (card: keyof CardVisibility) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  user, 
  cardVisibility,
  onToggleVisibility 
}) => {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {user?.businessName || "user"}! Here's a summary of your chatbots.
        </p>
      </div>
      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Dashboard settings</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Customization</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={cardVisibility.stats}
              onCheckedChange={() => onToggleVisibility("stats")}
            >
              {cardVisibility.stats ? (
                <Eye className="mr-2 h-4 w-4" />
              ) : (
                <EyeOff className="mr-2 h-4 w-4" />
              )}
              Statistics
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={cardVisibility.activity}
              onCheckedChange={() => onToggleVisibility("activity")}
            >
              {cardVisibility.activity ? (
                <Eye className="mr-2 h-4 w-4" />
              ) : (
                <EyeOff className="mr-2 h-4 w-4" />
              )}
              Recent Activity
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={cardVisibility.actions}
              onCheckedChange={() => onToggleVisibility("actions")}
            >
              {cardVisibility.actions ? (
                <Eye className="mr-2 h-4 w-4" />
              ) : (
                <EyeOff className="mr-2 h-4 w-4" />
              )}
              Quick Actions
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button asChild className="shrink-0">
          <Link to="/chatbots/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Chatbot
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
