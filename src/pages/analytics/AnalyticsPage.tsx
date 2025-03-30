
import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AnalyticsSummary from "@/components/analytics/AnalyticsSummary";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import AnalyticsError from "@/components/analytics/AnalyticsError";
import AnalyticsTabs from "@/components/analytics/AnalyticsTabs";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { toast } from "sonner";

const AnalyticsPage = () => {
  const { metricsData, countData, isLoading, metricsError } = useAnalyticsData();

  React.useEffect(() => {
    if (metricsError) {
      toast.error("Failed to load analytics data");
      console.error("Analytics data error:", metricsError);
    }
  }, [metricsError]);

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your chatbots' performance and usage
          </p>
        </div>

        <Separator />
        
        {metricsError ? (
          <AnalyticsError />
        ) : (
          <>
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : (
              <AnalyticsSummary data={countData} />
            )}

            <AnalyticsTabs metricsData={metricsData} isLoading={isLoading} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
