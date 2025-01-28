import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";

interface ReferralInflowData {
  currentPeriod: {
    startDate: string;
    endDate: string;
    total: number;
  };
  previousPeriod: {
    startDate: string;
    endDate: string;
    total: number;
  };
  percentageChange: number;
  timeSeries: Array<{
    date: string;
    count: number;
  }>;
}

type RoleFilter = "all" | "clinician" | "recruiter";

export function ReferralInflowWidget() {
  const [timeframe, setTimeframe] = useState<"week" | "month">("week");
  const [role, setRole] = useState<RoleFilter>("all");

  const { data, isLoading, error } = useQuery<ReferralInflowData>({
    queryKey: ["/api/recruiter/referrals/inflow", { timeframe, role }],
    queryFn: async () => {
      const params = new URLSearchParams({
        timeframe,
        ...(role !== "all" && { role }),
      });
      const response = await fetch(`/api/recruiter/referrals/inflow?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch referral inflow data");
      }
      return response.json();
    },
  });

  if (error) {
    return (
      <Card className="col-span-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-[400px] text-destructive">
            <p>Error loading referral data. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Referral Inflow</CardTitle>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full md:w-auto">
          <Select value={timeframe} onValueChange={(value: "week" | "month") => setTimeframe(value)}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue defaultValue={timeframe} placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Select value={role} onValueChange={(value: RoleFilter) => setRole(value)}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue defaultValue={role} placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="clinician">Clinicians</SelectItem>
              <SelectItem value="recruiter">Recruiters</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {data && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-2xl font-bold">{data.currentPeriod.total}</p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(data.currentPeriod.startDate), "MMM d")} -{" "}
                  {format(parseISO(data.currentPeriod.endDate), "MMM d, yyyy")}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Change from Previous Period</p>
                <div className="flex items-center gap-2">
                  {data.percentageChange >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <p
                    className={`text-2xl font-bold ${
                      data.percentageChange >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {data.percentageChange.toFixed(1)}%
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  vs. {format(parseISO(data.previousPeriod.startDate), "MMM d")} -{" "}
                  {format(parseISO(data.previousPeriod.endDate), "MMM d")}
                </p>
              </div>
            </div>
            <div className="h-[250px] sm:h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(parseISO(date), "MMM d")}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    formatter={(value: number) => [value, "Referrals"]}
                    labelFormatter={(date) => format(parseISO(date as string), "MMM d, yyyy")}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {isLoading && (
          <div className="flex h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}