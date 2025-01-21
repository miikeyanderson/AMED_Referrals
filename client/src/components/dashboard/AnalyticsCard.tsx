import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";

interface AnalyticsCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
}

export function AnalyticsCard({ title, value, change, trend }: AnalyticsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {trend === "up" ? (
          <TrendingUp className="h-4 w-4 text-green-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
          {change} from last month
        </p>
      </CardContent>
    </Card>
  );
}
