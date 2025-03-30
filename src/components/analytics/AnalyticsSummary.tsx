
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MessageSquare, FileText, BarChart } from "lucide-react";
import { CountData } from "@/hooks/useAnalyticsData";

interface AnalyticsSummaryProps {
  data?: CountData;
}

const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({ data }) => {
  // Ensure we have data to display or use zeros as fallback
  const chatbots = data?.chatbots ?? 0;
  const conversations = data?.conversations ?? 0;
  const documents = data?.documents ?? 0; 
  const messages = data?.messages ?? 0;

  // Log the values to help with debugging
  React.useEffect(() => {
    console.log("Analytics Summary Data:", {
      chatbots,
      conversations,
      documents,
      messages
    });
  }, [chatbots, conversations, documents, messages]);

  const summaryItems = [
    {
      title: "Chatbots",
      value: chatbots,
      icon: Bot,
      color: "text-purple-500",
      bgColor: "bg-purple-100",
      description: "Total accumulated"
    },
    {
      title: "Conversations",
      value: conversations,
      icon: MessageSquare,
      color: "text-blue-500",
      bgColor: "bg-blue-100",
      description: "Across all chatbots"
    },
    {
      title: "Documents",
      value: documents,
      icon: FileText,
      color: "text-amber-500",
      bgColor: "bg-amber-100",
      description: "Stored knowledge base"
    },
    {
      title: "Messages",
      value: messages,
      icon: BarChart,
      color: "text-green-500",
      bgColor: "bg-green-100",
      description: "Total exchanges"
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {summaryItems.map((item, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <div className={`rounded-full p-2 ${item.bgColor}`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {item.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AnalyticsSummary;
