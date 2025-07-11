
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bot, ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { MetricsData } from "@/hooks/useAnalyticsData";

interface MetricsDataItem {
  id: string;
  chatbot_id: string;
  precision: number;
  response_time: number;
  tokens_used: number;
  created_at: string;
  chatbots: {
    name: string;
    user_id: string;
  };
}

interface TopChatbotsProps {
  data?: MetricsData[];
  isLoading: boolean;
}

const TopChatbots: React.FC<TopChatbotsProps> = ({ data, isLoading }) => {
  // Process data to get the most used chatbots - data is already filtered by user in the parent component
  const getTopChatbots = () => {
    if (!data || data.length === 0) return [];
    
    // Group by chatbot
    const chatbotStats = data.reduce<Record<string, {
      id: string;
      name: string;
      queries: number;
      totalTokens: number;
      avgPrecision: number;
      avgResponseTime: number;
      lastUsed: string;
    }>>((acc, item) => {
      if (!acc[item.chatbot_id]) {
        acc[item.chatbot_id] = {
          id: item.chatbot_id,
          name: item.chatbots?.name || "Unnamed chatbot",
          queries: 0,
          totalTokens: 0,
          avgPrecision: 0,
          avgResponseTime: 0,
          lastUsed: item.created_at,
        };
      }
      
      const chatbot = acc[item.chatbot_id];
      chatbot.queries++;
      chatbot.totalTokens += item.tokens_used;
      // Accumulate for calculating average later
      chatbot.avgPrecision += item.precision;
      chatbot.avgResponseTime += item.response_time;
      
      // Update last used date if more recent
      if (new Date(item.created_at) > new Date(chatbot.lastUsed)) {
        chatbot.lastUsed = item.created_at;
      }
      
      return acc;
    }, {});
    
    // Calculate averages and sort by number of queries
    return Object.values(chatbotStats)
      .map(chatbot => ({
        ...chatbot,
        avgPrecision: chatbot.avgPrecision / chatbot.queries,
        avgResponseTime: chatbot.avgResponseTime / chatbot.queries,
      }))
      .sort((a, b) => b.queries - a.queries)
      .slice(0, 5); // Top 5
  };
  
  const topChatbots = getTopChatbots();
  
  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Content when no data is available
  if (!isLoading && (!data || data.length === 0 || topChatbots.length === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Chatbots</CardTitle>
          <CardDescription>No data available.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
          <Bot className="h-16 w-16 mb-4 opacity-20" />
          <p>Not enough data to display chatbot statistics.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Chatbots</CardTitle>
        <CardDescription>
          Most used chatbots and their metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Queries</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Precision</TableHead>
                <TableHead className="text-right">Last Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topChatbots.map((chatbot) => (
                <TableRow key={chatbot.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Link to={`/chatbots/${chatbot.id}`} className="flex items-center hover:text-primary group">
                        {chatbot.name}
                        <ArrowUpRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {chatbot.queries}
                  </TableCell>
                  <TableCell className="text-right">
                    {chatbot.totalTokens.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={chatbot.avgPrecision > 0.8 ? "success" : chatbot.avgPrecision > 0.5 ? "default" : "destructive"} className="font-normal">
                      {(chatbot.avgPrecision * 100).toFixed(0)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">
                    {formatDate(chatbot.lastUsed)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default TopChatbots;
