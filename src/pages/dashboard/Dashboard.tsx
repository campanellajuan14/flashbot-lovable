
import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, MessageSquare, Users, ArrowRight, Plus, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Dashboard = () => {
  const { user } = useAuth();

  // Fetch real chatbot count
  const { data: chatbotsData, isLoading: isLoadingChatbots } = useQuery({
    queryKey: ['dashboard-chatbots', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('chatbots')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Fetch real conversation count
  const { data: conversationsData, isLoading: isLoadingConversations } = useQuery({
    queryKey: ['dashboard-conversations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, chatbot_id, chatbots!inner(user_id)')
        .eq('chatbots.user_id', user?.id);
      
      if (error) throw error;
      return data?.length || 0;
    },
    enabled: !!user?.id,
  });

  // Fetch real metrics for response rate
  const { data: metricsData, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['dashboard-metrics', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retrieval_metrics')
        .select('precision, chatbots!inner(user_id)')
        .eq('chatbots.user_id', user?.id);
      
      if (error) throw error;
      
      // Calculate average precision (response rate)
      if (data && data.length > 0) {
        const avgPrecision = data.reduce((sum, curr) => sum + curr.precision, 0) / data.length;
        return Math.round(avgPrecision * 100); // Convert to percentage
      }
      
      return null;
    },
    enabled: !!user?.id,
  });

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

  // Dashboard stats with real/mock data
  const stats = [
    {
      title: "Total Chatbots",
      value: isLoadingChatbots ? <Skeleton className="h-8 w-16" /> : String(chatbotsData || 0),
      description: "Chatbots activos en tu cuenta",
      icon: MessageSquare,
      color: "text-indigo-500",
      link: "/chatbots",
      isReal: true
    },
    {
      title: "Total Conversaciones",
      value: isLoadingConversations ? <Skeleton className="h-8 w-16" /> : String(conversationsData || 0),
      description: "Conversaciones en los últimos 30 días",
      icon: Users,
      color: "text-cyan-500",
      link: "/analytics",
      isReal: true
    },
    {
      title: "Tasa de Respuesta",
      value: isLoadingMetrics ? 
        <Skeleton className="h-8 w-16" /> : 
        (metricsData !== null ? `${metricsData}%` : "94%"),
      description: "Consultas respondidas correctamente",
      icon: BarChart,
      color: "text-emerald-500",
      link: "/analytics",
      isReal: metricsData !== null
    },
  ];

  // Mock recent activity data
  const recentActivity = [
    {
      botName: "Soporte al Cliente",
      email: "usuario1@ejemplo.com",
      timeAgo: "2 horas",
      isReal: false
    },
    {
      botName: "Asistente de Ventas",
      email: "usuario2@ejemplo.com",
      timeAgo: "4 horas",
      isReal: false
    },
    {
      botName: "Guía de Productos",
      email: "usuario3@ejemplo.com",
      timeAgo: "6 horas",
      isReal: false
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, i) => (
            <Card key={i} className="dashboard-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                  <MockDataIndicator isReal={stat.isReal} />
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="dashboard-stat text-2xl font-bold">{stat.value}</div>
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

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="dashboard-card md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Actividad Reciente</CardTitle>
                <MockDataIndicator isReal={false} />
              </div>
              <CardDescription>
                Conversaciones y eventos recientes de tus chatbots
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-start space-x-4 rounded-md border p-3">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.botName}</p>
                      <p className="text-xs text-muted-foreground">
                        Nueva conversación con usuario{" "}
                        <span className="font-semibold text-foreground">{activity.email}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Hace {activity.timeAgo}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Ver
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
