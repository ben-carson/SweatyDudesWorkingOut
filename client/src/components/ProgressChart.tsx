import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ProgressData {
  date: string;
  weight: number;
  reps: number;
  volume: number;
}

interface ProgressChartProps {
  exercise: string;
  data: ProgressData[];
  metric: 'weight' | 'volume' | 'reps';
}

export default function ProgressChart({ exercise, data, metric }: ProgressChartProps) {
  const getMetricLabel = () => {
    switch (metric) {
      case 'weight': return 'Max Weight (kg)';
      case 'volume': return 'Total Volume (kg)';
      case 'reps': return 'Max Reps';
      default: return 'Progress';
    }
  };

  const getCurrentValue = () => data[data.length - 1]?.[metric] || 0;
  const getPreviousValue = () => data[data.length - 2]?.[metric] || 0;
  
  const getChangePercent = () => {
    const current = getCurrentValue();
    const previous = getPreviousValue();
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getTrendIcon = () => {
    const change = getChangePercent();
    if (change > 0) return <TrendingUp className="w-4 h-4 text-chart-1" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getTrendColor = () => {
    const change = getChangePercent();
    if (change > 0) return 'text-chart-1';
    if (change < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">{exercise}</CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            {getTrendIcon()}
            <span className={`text-sm font-mono ${getTrendColor()}`}>
              {getChangePercent() > 0 && '+'}{getChangePercent().toFixed(1)}%
            </span>
          </Badge>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono">{getCurrentValue()}</span>
          <span className="text-sm text-muted-foreground">{getMetricLabel()}</span>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey={metric} 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--chart-1))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}