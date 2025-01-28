import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, HelpCircle, Hourglass, Inbox, ThumbsDown, CheckCircle } from "lucide-react";

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Referral Statistics</CardTitle>
          <p className="text-sm text-muted-foreground">
            {data?.timeframe?.start && new Date(data.timeframe.start).toLocaleDateString()} - {data?.timeframe?.end && new Date(data.timeframe.end).toLocaleDateString()}
          </p>
        </div>
        <Select defaultValue="week">
          <SelectTrigger className="w-28">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <FileSpreadsheet className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium leading-none">Total</p>
                  <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Inbox className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium leading-none">Pending</p>
                  <p className="text-2xl font-bold">{stats.pendingReferrals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Hourglass className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium leading-none">In Progress</p>
                  <p className="text-2xl font-bold">{stats.inProgressReferrals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium leading-none">Completed</p>
                  <p className="text-2xl font-bold">{stats.completedReferrals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}