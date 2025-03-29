
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ResponsiveBar } from "recharts";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
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
  };
}

interface UsageChartProps {
  data?: MetricsDataItem[];
  isLoading: boolean;
}

const UsageChart: React.FC<UsageChartProps> = ({ data, isLoading }) => {
  // Procesar los datos para el gráfico de uso
  const getUsageData = () => {
    if (!data || data.length === 0) {
      // Si no hay datos, generar datos de ejemplo con los últimos 7 días
      return Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return {
          date: format(date, 'yyyy-MM-dd'),
          formattedDate: format(date, 'd MMM', { locale: es }),
          tokens: 0,
          queries: 0
        };
      });
    }
    
    // Agrupar por fecha (día)
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
    
    // Asegurar que tengamos datos para los últimos 7 días
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const formattedDate = format(subDays(new Date(), i), 'd MMM', { locale: es });
      
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
  
  // Configuración de color para los gráficos
  const config = {
    tokens: {
      label: "Tokens",
      theme: {
        light: "#7E69AB",
        dark: "#9b87f5",
      }
    },
    queries: {
      label: "Consultas",
      theme: {
        light: "#0EA5E9",
        dark: "#38BDF8",
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uso del Sistema</CardTitle>
        <CardDescription>
          Tokens y consultas por día
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <div className="h-[300px]">
            <ChartContainer config={config}>
              <ResponsiveBar
                data={usageData}
                keys={["tokens", "queries"]}
                indexBy="formattedDate"
                margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
                padding={0.3}
                valueScale={{ type: "linear" }}
                indexScale={{ type: "band", round: true }}
                colors={["#9b87f5", "#38BDF8"]}
                borderRadius={4}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: "Fecha",
                  legendPosition: "middle",
                  legendOffset: 32
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: "Cantidad",
                  legendPosition: "middle",
                  legendOffset: -50
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{
                  from: "color",
                  modifiers: [["darker", 1.6]]
                }}
                groupMode="grouped"
              />
              <ChartTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <ChartTooltipContent
                        className="bg-background"
                        label={label}
                        labelClassName="font-medium text-foreground"
                        payload={payload}
                      />
                    );
                  }
                  return null;
                }}
              />
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UsageChart;
