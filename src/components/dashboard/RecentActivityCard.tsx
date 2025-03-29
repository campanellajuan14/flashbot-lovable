
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

interface ActivityItem {
  botName: string;
  email: string;
  timeAgo: string;
  isReal: boolean;
}

interface RecentActivityCardProps {
  activities: ActivityItem[];
}

const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ activities }) => {
  return (
    <Card className="dashboard-card md:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>Sample data</span>
          </div>
        </div>
        <CardDescription>
          Recent conversations and events from your chatbots
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, i) => (
            <div key={i} className="flex items-start space-x-4 rounded-md border p-3 border-dashed border-muted">
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{activity.botName}</p>
                <p className="text-xs text-muted-foreground italic">
                  New conversation with user{" "}
                  <span className="font-semibold">{activity.email}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {activity.timeAgo} ago
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                View
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivityCard;
export type { ActivityItem };
