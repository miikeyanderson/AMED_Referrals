import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Loader2, TrendingUp, Clock, Users } from "lucide-react";

interface KPIData {
  conversionRate: {
    current: number;
    target: number;
    trend: Array<{ date: string; value: number }>;
  };
  timeToHire: {
    current: number;
    target: number;
    trend: Array<{ date: string; value: number }>;
  };
  activeRequisitions: number;
  totalPlacements: number;
}

export function KPIGroupWidget() {
  const { data: kpiData, isLoading } = useQuery({
    queryKey: ["/api/recruiter/kpis"],
    queryFn: async () => {
      const response = await fetch("/api/recruiter/kpis");
      if (!response.ok) {
        throw new Error("Failed to fetch KPI data");
      }
      return response.json() as Promise<KPIData>;
    },
  });

  const renderMetric = (value: number | undefined, label: string, target?: number) => {
    if (isLoading) {
      return (
        <div className="animate-pulse">
          <div className="h-8 w-24 bg-muted rounded" />
          {target && <Progress value={0} className="mt-3 opacity-50" />}
        </div>
      );
    }
    return value !== undefined ? (
      <>
        <div className="text-2xl font-bold">
          {label.includes('days') ? `${value} days` : `${value.toFixed(1)}%`}
        </div>
        {target && (
          <>
            <Progress 
              value={(value / target) * 100} 
              className="mt-3 relative z-0"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Target: {label.includes('days') ? `${target} days` : `${target}%`}
            </p>
          </>
        )}
      </>
    ) : null;
  };

  if (!kpiData) {
    return null;
  }

  return (
    <Card className="col-span-full relative">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Recruiter Performance KPIs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* KPI Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Conversion Rate Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {renderMetric(
                kpiData?.conversionRate.current,
                'percentage',
                kpiData?.conversionRate.target
              )}
            </CardContent>
          </Card>

          {/* Time to Hire Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time to Hire</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpiData.timeToHire.current} days
              </div>
              <Progress 
                value={
                  ((kpiData.timeToHire.target - kpiData.timeToHire.current) / 
                  kpiData.timeToHire.target) * 100
                } 
                className="mt-3"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Target: {kpiData.timeToHire.target} days
              </p>
            </CardContent>
          </Card>

          {/* Active Requisitions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Requisitions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData.activeRequisitions}</div>
            </CardContent>
          </Card>

          {/* Total Placements */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Placements</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData.totalPlacements}</div>
            </CardContent>
          </Card>
        </div>

        {/* Trend Analysis Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Conversion Rate Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Conversion Rate Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <ChartContainer config={{}}>
                  <LineChart data={kpiData.conversionRate.trend}>
                    <XAxis
                      dataKey="date"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload) return null;
                        return (
                          <ChartTooltipContent>
                            {payload.map((entry) => (
                              <div key={entry.value}>
                                {entry.value.toFixed(1)}%
                              </div>
                            ))}
                          </ChartTooltipContent>
                        );
                      }}
                    />
                  </LineChart>
                </ChartContainer>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Time to Hire Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Time to Hire Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <ChartContainer config={{}}>
                  <LineChart data={kpiData.timeToHire.trend}>
                    <XAxis
                      dataKey="date"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}d`}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload) return null;
                        return (
                          <ChartTooltipContent>
                            {payload.map((entry) => (
                              <div key={entry.value}>
                                {entry.value} days
                              </div>
                            ))}
                          </ChartTooltipContent>
                        );
                      }}
                    />
                  </LineChart>
                </ChartContainer>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}