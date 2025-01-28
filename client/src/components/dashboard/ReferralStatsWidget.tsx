
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, ClipboardList, Clock, CheckCircle2 } from "lucide-react";

export function ReferralStatsWidget() {
  const { data } = useQuery({
    queryKey: ['/api/clinician/referrals-stats', { range: 'week' }],
    queryFn: async () => {
      const response = await fetch('/api/clinician/referrals-stats?range=week');
      if (!response.ok) {
        throw new Error('Failed to fetch referral stats');
      }
      return response.json();
    }
  });

  const stats = data?.statistics || {
    totalReferrals: 0,
    pendingReferrals: 0,
    inProgressReferrals: 0,
    completedReferrals: 0,
    rejectedReferrals: 0
  };

  return (
    <Card className="w-full bg-background/5 backdrop-blur-sm border-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-xl">Referral Statistics</CardTitle>
          <p className="text-sm text-muted-foreground">
            {data?.timeframe?.start && new Date(data.timeframe.start).toLocaleDateString()} - {data?.timeframe?.end && new Date(data.timeframe.end).toLocaleDateString()}
          </p>
        </div>
        <Select defaultValue="week">
          <SelectTrigger className="w-[120px] bg-background/10 border-0">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-1 gap-2">
          <Card className="bg-blue-500/10 hover:bg-blue-500/20 transition-all border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/20 p-2">
                <FileSpreadsheet className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.totalReferrals}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-500/10 hover:bg-amber-500/20 transition-all border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/20 p-2">
                <ClipboardList className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pendingReferrals}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-500/10 hover:bg-purple-500/20 transition-all border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/20 p-2">
                <Clock className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{stats.inProgressReferrals}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-500/10 hover:bg-green-500/20 transition-all border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-green-500/20 p-2">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completedReferrals}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
