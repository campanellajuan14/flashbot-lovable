
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, MessageSquare, Users } from "lucide-react";
import { Stat } from "./DashboardStats";
import { ActivityItem } from "./RecentActivityCard";

export function useDashboardData() {
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

  // Dashboard stats with real/mock data
  const stats: Stat[] = [
    {
      title: "Total Chatbots",
      value: isLoadingChatbots ? "..." : String(chatbotsData || 0),
      description: "Active chatbots in your account",
      icon: MessageSquare,
      color: "text-indigo-500",
      link: "/chatbots",
      isReal: true
    },
    {
      title: "Total Conversations",
      value: isLoadingConversations ? "..." : String(conversationsData || 0),
      description: "Conversations in the last 30 days",
      icon: Users,
      color: "text-cyan-500",
      link: "/analytics",
      isReal: true
    },
    {
      title: "Response Rate",
      value: isLoadingMetrics ? 
        "..." : 
        (metricsData !== null ? `${metricsData}%` : "94%"),
      description: "Queries answered correctly",
      icon: BarChart,
      color: "text-emerald-500",
      link: "/analytics",
      isReal: metricsData !== null
    },
  ];

  // Mock recent activity data
  const recentActivity: ActivityItem[] = [
    {
      botName: "Customer Support",
      email: "user1@example.com",
      timeAgo: "2 hours",
      isReal: false
    },
    {
      botName: "Sales Assistant",
      email: "user2@example.com",
      timeAgo: "4 hours",
      isReal: false
    },
    {
      botName: "Product Guide",
      email: "user3@example.com",
      timeAgo: "6 hours",
      isReal: false
    }
  ];

  return {
    user,
    stats,
    recentActivity
  };
}
