
import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import RecentActivityCard from "@/components/dashboard/RecentActivityCard";
import QuickActionsCard from "@/components/dashboard/QuickActionsCard";
import { useDashboardData } from "@/components/dashboard/useDashboardData";

// Define the interface for card visibility state
interface CardVisibility {
  stats: boolean;
  activity: boolean;
  actions: boolean;
}

const Dashboard = () => {
  const { user, stats, recentActivity } = useDashboardData();
  
  // Add state for card visibility with default values (all visible)
  const [cardVisibility, setCardVisibility] = useState<CardVisibility>({
    stats: true,
    activity: true,
    actions: true
  });

  // Toggle function for card visibility
  const toggleCardVisibility = (card: keyof CardVisibility) => {
    setCardVisibility(prev => ({
      ...prev,
      [card]: !prev[card]
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DashboardHeader 
          user={user} 
          cardVisibility={cardVisibility} 
          onToggleVisibility={toggleCardVisibility} 
        />
        
        {cardVisibility.stats && <DashboardStats stats={stats} />}
        
        <div className="grid gap-4 md:grid-cols-3">
          {cardVisibility.activity && <RecentActivityCard activities={recentActivity} />}
          {cardVisibility.actions && <QuickActionsCard />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
