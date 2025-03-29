
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PerformanceMetrics from "@/components/analytics/PerformanceMetrics";
import UsageChart from "@/components/analytics/UsageChart";
import TopChatbots from "@/components/analytics/TopChatbots";
import { MetricsData } from "@/hooks/useAnalyticsData";

interface AnalyticsTabsProps {
  metricsData?: MetricsData[];
  isLoading: boolean;
}

const AnalyticsTabs: React.FC<AnalyticsTabsProps> = ({ metricsData, isLoading }) => {
  return (
    <Tabs defaultValue="performance" className="w-full">
      <TabsList>
        <TabsTrigger value="performance">Performance</TabsTrigger>
        <TabsTrigger value="usage">Usage</TabsTrigger>
        <TabsTrigger value="chatbots">Chatbots</TabsTrigger>
      </TabsList>
      
      <TabsContent value="performance" className="space-y-4">
        <PerformanceMetrics data={metricsData} isLoading={isLoading} />
      </TabsContent>
      
      <TabsContent value="usage" className="space-y-4">
        <UsageChart data={metricsData} isLoading={isLoading} />
      </TabsContent>
      
      <TabsContent value="chatbots" className="space-y-4">
        <TopChatbots data={metricsData} isLoading={isLoading} />
      </TabsContent>
    </Tabs>
  );
};

export default AnalyticsTabs;
