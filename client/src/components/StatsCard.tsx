import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className = ""
}: StatsCardProps) {
  return (
    <Card className={`hover-elevate ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-2xl font-bold font-mono">{value}</div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {trend && (
            <Badge 
              variant="outline" 
              className={`text-xs ${
                trend.isPositive 
                  ? 'text-chart-1 border-chart-1/20 bg-chart-1/5' 
                  : 'text-destructive border-destructive/20 bg-destructive/5'
              }`}
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}