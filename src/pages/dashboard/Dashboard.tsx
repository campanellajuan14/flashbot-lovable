
import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import RecentActivityCard from "@/components/dashboard/RecentActivityCard";
import QuickActionsCard from "@/components/dashboard/QuickActionsCard";
import { useDashboardData } from "@/components/dashboard/useDashboardData";

const Dashboard = () => {
  const { user, stats, recentActivity } = useDashboardData();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DashboardHeader user={user} />
        <DashboardStats stats={stats} />
        <div className="grid gap-4 md:grid-cols-3">
          <RecentActivityCard activities={recentActivity} />
          <QuickActionsCard />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
