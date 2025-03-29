
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MessageSquare, FileText, BarChart } from "lucide-react";

interface AnalyticsSummaryProps {
  data?: {
    chatbots: number;
    conversations: number;
    documents: number;
    messages: number;
  };
}

const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({ data }) => {
  const summaryItems = [
    {
      title: "Chatbots",
      value: data?.chatbots || 0,
      icon: Bot,
      color: "text-purple-500",
      bgColor: "bg-purple-100",
    },
    {
      title: "Conversaciones",
      value: data?.conversations || 0,
      icon: MessageSquare,
      color: "text-blue-500",
      bgColor: "bg-blue-100",
    },
    {
      title: "Documentos",
      value: data?.documents || 0,
      icon: FileText,
      color: "text-amber-500",
      bgColor: "bg-amber-100",
    },
    {
      title: "Mensajes",
      value: data?.messages || 0,
      icon: BarChart,
      color: "text-green-500",
      bgColor: "bg-green-100",
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
              {index % 2 === 0 ? "Total acumulado" : "Últimos 30 días"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AnalyticsSummary;
