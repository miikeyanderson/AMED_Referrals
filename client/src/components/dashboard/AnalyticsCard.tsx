
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
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:p-6 pb-2">
        <CardTitle className="text-sm sm:text-base font-medium">{title}</CardTitle>
        {trend === "up" ? (
          <TrendingUp className="h-4 w-4 text-green-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500" />
        )}
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="text-xl sm:text-2xl font-bold">{value}</div>
        <p className={`text-xs sm:text-sm ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
          {change} from last month
        </p>
      </CardContent>
    </Card>
  );
}
