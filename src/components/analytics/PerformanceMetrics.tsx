import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Activity, Clock, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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

interface PerformanceMetricsProps {
  data?: MetricsData[];
  isLoading: boolean;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ data, isLoading }) => {
  // Process data if available - data is already filtered by user in the parent component
  const getProcessedData = () => {
    if (!data || data.length === 0) return [];
    
    // Group by date (day)
    const groupedByDate = data.reduce<Record<string, {
      precision: number[];
      response_time: number[];
      tokens_used: number[];
      count: number;
    }>>((acc, item) => {
      const date = format(new Date(item.created_at), 'yyyy-MM-dd');
      
      if (!acc[date]) {
        acc[date] = {
          precision: [],
          response_time: [],
          tokens_used: [],
          count: 0
        };
      }
      
      acc[date].precision.push(item.precision);
      acc[date].response_time.push(item.response_time);
      acc[date].tokens_used.push(item.tokens_used);
      acc[date].count++;
      
      return acc;
    }, {});
    
    // Convert to format for charts
    return Object.entries(groupedByDate).map(([date, metrics]) => {
      const avgPrecision = metrics.precision.reduce((sum, val) => sum + val, 0) / metrics.count;
      const avgResponseTime = metrics.response_time.reduce((sum, val) => sum + val, 0) / metrics.count;
      const avgTokens = metrics.tokens_used.reduce((sum, val) => sum + val, 0) / metrics.count;
      
      return {
        date,
        formattedDate: format(new Date(date), 'd MMM', { locale: es }),
        precision: avgPrecision,
        response_time: avgResponseTime,
        tokens_used: avgTokens,
        count: metrics.count
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };
  
  const chartData = getProcessedData();
  
  // Configuración de color para los gráficos
  const config = {
    precision: {
      label: "Precisión",
      theme: {
        light: "#9b87f5",
        dark: "#7E69AB",
      }
    },
    response_time: {
      label: "Tiempo de Respuesta",
      theme: {
        light: "#ea384c",
        dark: "#DC2626",
      }
    },
    tokens_used: {
      label: "Tokens Usados",
      theme: {
        light: "#0EA5E9",
        dark: "#0284C7",
      }
    },
  };
  
  // Si no hay datos
  if (!isLoading && (!data || data.length === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rendimiento</CardTitle>
          <CardDescription>No hay datos de rendimiento disponibles.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          No hay suficientes datos para mostrar métricas de rendimiento.
        </CardContent>
      </Card>
    );
  }
  
  // Componente de métrica individual
  const MetricCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon,
    color,
    isLoading
  }: { 
    title: string; 
    value: string | number; 
    description: string;
    icon: React.FC<{ className?: string }>;
    color: string;
    isLoading: boolean;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24 mb-1" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
  
  // Calcular promedios para las métricas
  const avgPrecision = chartData.length ? 
    chartData.reduce((sum, item) => sum + item.precision, 0) / chartData.length : 0;
  
  const avgResponseTime = chartData.length ? 
    chartData.reduce((sum, item) => sum + item.response_time, 0) / chartData.length : 0;
  
  const avgTokensUsed = chartData.length ? 
    chartData.reduce((sum, item) => sum + item.tokens_used, 0) / chartData.length : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard 
          title="Precisión Promedio"
          value={`${(avgPrecision * 100).toFixed(1)}%`}
          description="Promedio de precisión en respuestas"
          icon={Activity}
          color="text-purple-500"
          isLoading={isLoading}
        />
        <MetricCard 
          title="Tiempo de Respuesta"
          value={`${avgResponseTime.toFixed(0)} ms`}
          description="Tiempo promedio de respuesta"
          icon={Clock}
          color="text-red-500"
          isLoading={isLoading}
        />
        <MetricCard 
          title="Tokens Promedio"
          value={avgTokensUsed.toFixed(0)}
          description="Tokens promedio por consulta"
          icon={Zap}
          color="text-blue-500"
          isLoading={isLoading}
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Tendencias de Rendimiento</CardTitle>
          <CardDescription>
            Evolución de métricas en el tiempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="formattedDate" 
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value * 100}%`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value} ms`}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === "precision") {
                        return [`${(Number(value) * 100).toFixed(1)}%`, "Precisión"];
                      }
                      if (name === "response_time") {
                        return [`${Number(value).toFixed(0)} ms`, "Tiempo de Respuesta"];
                      }
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="precision"
                    name="Precisión"
                    stroke="#9b87f5"
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="response_time"
                    name="Tiempo de Respuesta"
                    stroke="#ea384c"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMetrics;
