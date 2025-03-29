
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

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

interface UsageChartProps {
  data?: MetricsDataItem[];
  isLoading: boolean;
}

const UsageChart: React.FC<UsageChartProps> = ({ data, isLoading }) => {
  // Process data for usage chart - data is already filtered by user in the parent component
  const getUsageData = () => {
    if (!data || data.length === 0) {
      // If no data, generate example data with the last 7 days
      return Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return {
          date: format(date, 'yyyy-MM-dd'),
          formattedDate: format(date, 'd MMM'),
          tokens: 0,
          queries: 0
        };
      });
    }
    
    // Group by date (day)
    const groupedByDate = data.reduce<Record<string, {
      tokens: number;
      queries: number;
    }>>((acc, item) => {
      const date = format(new Date(item.created_at), 'yyyy-MM-dd');
      
      if (!acc[date]) {
        acc[date] = {
          tokens: 0,
          queries: 0
        };
      }
      
      acc[date].tokens += item.tokens_used;
      acc[date].queries += 1;
      
      return acc;
    }, {});
    
    // Ensure we have data for the last 7 days
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const formattedDate = format(subDays(new Date(), i), 'd MMM');
      
      if (groupedByDate[date]) {
        result.push({
          date,
          formattedDate,
          tokens: groupedByDate[date].tokens,
          queries: groupedByDate[date].queries
        });
      } else {
        result.push({
          date,
          formattedDate,
          tokens: 0,
          queries: 0
        });
      }
    }
    
    return result;
  };
  
  const usageData = getUsageData();

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Usage</CardTitle>
        <CardDescription>
          Tokens and queries per day
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={usageData}
                margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
                barGap={8}
                barSize={20}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="formattedDate" 
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis 
                  yAxisId="left" 
                  orientation="left" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value}
                  label={{ value: 'Tokens', angle: -90, position: 'insideLeft', dx: -20 }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Queries', angle: 90, position: 'insideRight', dx: 20 }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "tokens") {
                      return [value, "Tokens"];
                    }
                    if (name === "queries") {
                      return [value, "Queries"];
                    }
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="tokens" 
                  name="Tokens" 
                  fill="#9b87f5" 
                  radius={[4, 4, 0, 0]} 
                />
                <Bar 
                  yAxisId="right"
                  dataKey="queries" 
                  name="Queries" 
                  fill="#38BDF8" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UsageChart;
