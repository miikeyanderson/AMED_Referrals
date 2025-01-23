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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Loader2, HelpCircle } from "lucide-react";

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

const tooltipDescriptions = {
  total: "Total number of candidates you've referred",
  pending: "Referrals awaiting initial review by the recruitment team",
  inProgress: "Candidates currently in the interview process",
  completed: "Successfully hired candidates from your referrals",
  rejected: "Referrals that didn't proceed to hiring"
};

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
    <TooltipProvider>
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="space-y-2 cursor-help">
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">
                          {stats?.statistics.totalReferrals || 0}
                        </p>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">Total Referrals</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tooltipDescriptions.total}</p>
                  </TooltipContent>
                </Tooltip>
                <div className="grid grid-cols-2 gap-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="space-y-1 cursor-help">
                        <p className="text-lg font-semibold text-primary">
                          {stats?.statistics.pendingReferrals || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Pending</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{tooltipDescriptions.pending}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="space-y-1 cursor-help">
                        <p className="text-lg font-semibold text-blue-500">
                          {stats?.statistics.inProgressReferrals || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">In Progress</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{tooltipDescriptions.inProgress}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="space-y-1 cursor-help">
                        <p className="text-lg font-semibold text-amber-500">
                          {stats?.statistics.completedReferrals || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{tooltipDescriptions.completed}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="space-y-1 cursor-help">
                        <p className="text-lg font-semibold text-red-500">
                          {stats?.statistics.rejectedReferrals || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Rejected</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{tooltipDescriptions.rejected}</p>
                    </TooltipContent>
                  </Tooltip>
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
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border rounded-lg shadow-lg p-3">
                              <p className="font-semibold">{data.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Count: {data.value}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {tooltipDescriptions[data.name.toLowerCase() as keyof typeof tooltipDescriptions]}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}