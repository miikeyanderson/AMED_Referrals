
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
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <div>
          <CardTitle className="text-xl sm:text-2xl">Referral Statistics</CardTitle>
          <p className="text-sm text-muted-foreground">
            {data?.timeframe?.start && new Date(data.timeframe.start).toLocaleDateString()} - {data?.timeframe?.end && new Date(data.timeframe.end).toLocaleDateString()}
          </p>
        </div>
        <Select defaultValue="week">
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-transparent hover:from-blue-500/20 transition-all">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="rounded-lg bg-blue-500/20 p-2">
                  <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-0.5">{stats.totalReferrals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-transparent hover:from-amber-500/20 transition-all">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="rounded-lg bg-amber-500/20 p-2">
                  <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-0.5">{stats.pendingReferrals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-transparent hover:from-purple-500/20 transition-all">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="rounded-lg bg-purple-500/20 p-2">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-0.5">{stats.inProgressReferrals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-transparent hover:from-green-500/20 transition-all">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="rounded-lg bg-green-500/20 p-2">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-0.5">{stats.completedReferrals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
