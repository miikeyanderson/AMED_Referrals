import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Loader2 } from "lucide-react";

interface ReferralStats {
  timeframe: {
    start: string;
    end: string;
    range: 'week' | 'month' | 'quarter' | 'custom';
  };
  statistics: {
    totalReferrals: number;
    pendingReferrals: number;
    inProgressReferrals: number;
    completedReferrals: number;
    rejectedReferrals: number;
  };
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

export function ReferralStatsWidget() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week');

  const { data: stats, isLoading, error } = useQuery<ReferralStats>({
    queryKey: ['/api/clinician/referrals-stats', { range: timeRange }],
    queryFn: async () => {
      const response = await fetch(`/api/clinician/referrals-stats?range=${timeRange}`);
      if (!response.ok) {
        if (response.status >= 500) {
          throw new Error("Server error while fetching statistics");
        }
        throw new Error(await response.text());
      }
      return response.json();
    }
  });

  const chartData = stats ? [
    { name: 'Pending', value: stats.statistics.pendingReferrals },
    { name: 'In Progress', value: stats.statistics.inProgressReferrals },
    { name: 'Completed', value: stats.statistics.completedReferrals },
    { name: 'Rejected', value: stats.statistics.rejectedReferrals }
  ] : [];

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-destructive text-sm">
            Error loading referral statistics: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Referral Statistics</CardTitle>
            <CardDescription>
              {stats && `${format(new Date(stats.timeframe.start), 'MMM d, yyyy')} - ${format(new Date(stats.timeframe.end), 'MMM d, yyyy')}`}
            </CardDescription>
          </div>
          <Select value={timeRange} onValueChange={(value: 'week' | 'month' | 'quarter') => setTimeRange(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="quarter">Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-2xl font-bold">
                  {stats?.statistics.totalReferrals || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-primary">
                    {stats?.statistics.pendingReferrals || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-blue-500">
                    {stats?.statistics.inProgressReferrals || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-amber-500">
                    {stats?.statistics.completedReferrals || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-red-500">
                    {stats?.statistics.rejectedReferrals || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                </div>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
