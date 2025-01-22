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

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!kpiData) {
    return null;
  }

  return (
    <Card className="col-span-full">
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
              <div className="text-2xl font-bold">
                {kpiData.conversionRate.current.toFixed(1)}%
              </div>
              <Progress 
                value={(kpiData.conversionRate.current / kpiData.conversionRate.target) * 100} 
                className="mt-3"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Target: {kpiData.conversionRate.target}%
              </p>
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
              <div className="h-[200px]">
                <ChartContainer>
                  <ResponsiveContainer width="100%" height="100%">
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
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          {/* Time to Hire Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Time to Hire Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ChartContainer>
                  <ResponsiveContainer width="100%" height="100%">
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
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}