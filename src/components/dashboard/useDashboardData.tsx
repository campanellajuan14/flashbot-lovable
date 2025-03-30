
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

  // Improved fetch real conversation count - no longer using join to ensure all conversations are counted
  const { data: conversationsData, isLoading: isLoadingConversations } = useQuery({
    queryKey: ['dashboard-conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      // First get the user's chatbot IDs
      const { data: chatbots, error: chatbotsError } = await supabase
        .from('chatbots')
        .select('id')
        .eq('user_id', user.id);
      
      if (chatbotsError) throw chatbotsError;
      
      if (!chatbots || chatbots.length === 0) {
        return 0;
      }
      
      const chatbotIds = chatbots.map(chatbot => chatbot.id);
      
      // Then count all conversations for these chatbots
      const { count, error: conversationsError } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .in('chatbot_id', chatbotIds);
      
      if (conversationsError) throw conversationsError;
      
      console.log(`Found ${count} conversations for user ${user.id}`);
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Fetch real metrics for response rate
  const { data: metricsData, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['dashboard-metrics', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // Get user's chatbot IDs first
      const { data: chatbots, error: chatbotsError } = await supabase
        .from('chatbots')
        .select('id')
        .eq('user_id', user.id);
      
      if (chatbotsError) throw chatbotsError;
      
      if (!chatbots || chatbots.length === 0) {
        return null;
      }
      
      const chatbotIds = chatbots.map(chatbot => chatbot.id);
      
      // Get metrics for all these chatbots
      const { data, error } = await supabase
        .from('retrieval_metrics')
        .select('precision')
        .in('chatbot_id', chatbotIds);
      
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

  // Fetch recent activity - getting real data now
  const { data: recentActivityData, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['dashboard-recent-activity', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get user's chatbot IDs
      const { data: chatbots, error: chatbotsError } = await supabase
        .from('chatbots')
        .select('id, name')
        .eq('user_id', user.id);
      
      if (chatbotsError) throw chatbotsError;
      
      if (!chatbots || chatbots.length === 0) {
        return [];
      }
      
      const chatbotIds = chatbots.map(chatbot => chatbot.id);
      const chatbotMap = Object.fromEntries(chatbots.map(c => [c.id, c.name]));
      
      // Fetch recent conversations
      const { data, error } = await supabase
        .from('conversations')
        .select('id, chatbot_id, user_identifier, created_at')
        .in('chatbot_id', chatbotIds)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      // Transform into activity items
      return (data || []).map(conv => {
        const minutesAgo = Math.floor((Date.now() - new Date(conv.created_at).getTime()) / (1000 * 60));
        let timeAgo;
        
        if (minutesAgo < 60) {
          timeAgo = `${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''}`;
        } else {
          const hoursAgo = Math.floor(minutesAgo / 60);
          if (hoursAgo < 24) {
            timeAgo = `${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''}`;
          } else {
            const daysAgo = Math.floor(hoursAgo / 24);
            timeAgo = `${daysAgo} day${daysAgo !== 1 ? 's' : ''}`;
          }
        }
        
        return {
          botName: chatbotMap[conv.chatbot_id] || 'Unknown Bot',
          email: conv.user_identifier || 'Anonymous User',
          timeAgo: `${timeAgo} ago`,
          isReal: true
        };
      });
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
      description: "All conversations with your chatbots",
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

  // Use real activity data if available, otherwise use fallback mock data
  const recentActivity: ActivityItem[] = isLoadingActivity || !recentActivityData || recentActivityData.length === 0 ? 
    [
      {
        botName: "Customer Support",
        email: "user1@example.com",
        timeAgo: "2 hours ago",
        isReal: false
      },
      {
        botName: "Sales Assistant",
        email: "user2@example.com",
        timeAgo: "4 hours ago",
        isReal: false
      },
      {
        botName: "Product Guide",
        email: "user3@example.com",
        timeAgo: "6 hours ago",
        isReal: false
      }
    ] : recentActivityData;

  return {
    user,
    stats,
    recentActivity
  };
}
