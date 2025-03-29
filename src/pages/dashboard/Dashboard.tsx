
import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, MessageSquare, Users, ArrowRight, Plus } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();

  // Mock data for dashboard stats
  const stats = [
    {
      title: "Total Chatbots",
      value: "3",
      description: "Active chatbots in your account",
      icon: MessageSquare,
      color: "text-indigo-500",
      link: "/chatbots",
    },
    {
      title: "Total Conversations",
      value: "124",
      description: "Conversations in the last 30 days",
      icon: Users,
      color: "text-cyan-500",
      link: "/analytics",
    },
    {
      title: "Response Rate",
      value: "94%",
      description: "Successfully answered queries",
      icon: BarChart,
      color: "text-emerald-500",
      link: "/analytics",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.businessName || "there"}! Here's what's happening with your chatbots.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link to="/chatbots/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Chatbot
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, i) => (
            <Card key={i} className="dashboard-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="dashboard-stat">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
                <Button variant="ghost" size="sm" className="mt-4 px-0" asChild>
                  <Link to={stat.link}>
                    View details
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="dashboard-card md:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your chatbots' recent conversations and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start space-x-4 rounded-md border p-3">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">Customer Support Bot</p>
                      <p className="text-xs text-muted-foreground">
                        New conversation with user{" "}
                        <span className="font-semibold text-foreground">user{i}@example.com</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {i * 2} hours ago
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
