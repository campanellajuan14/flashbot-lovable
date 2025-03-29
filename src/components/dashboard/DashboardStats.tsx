
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface Stat {
  title: string;
  value: React.ReactNode;
  description: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  link: string;
  isReal: boolean;
}

// Mock data indicator component
const MockDataIndicator = ({ isReal }: { isReal: boolean }) => (
  isReal ? null : (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="ml-1 inline-flex">
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Dato simulado</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
);

interface DashboardStatsProps {
  stats: Stat[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, i) => (
        <Card key={i} className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              {stat.title}
              <MockDataIndicator isReal={stat.isReal} />
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`dashboard-stat text-2xl font-bold ${!stat.isReal ? "text-muted-foreground italic" : ""}`}>
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
            <Button variant="ghost" size="sm" className="mt-4 px-0" asChild>
              <Link to={stat.link}>
                Ver detalles
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
export type { Stat };
