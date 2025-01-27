
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";
import { ReferralStatsWidget } from "@/components/dashboard/ReferralStatsWidget";
import { ClinicianBadges } from "@/components/dashboard/ClinicianBadges";
import { RewardsSnapshotWidget } from "@/components/RewardsSnapshotWidget";
import { ReferralForm } from "@/components/dashboard/ReferralForm";
import { useQuery } from "@tanstack/react-query";

export default function ClinicianDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['/api/clinician/referrals-stats', { range: 'week' }],
    queryFn: async () => {
      const response = await fetch('/api/clinician/referrals-stats?range=week');
      if (!response.ok) {
        return {
          statistics: {
            totalReferrals: 0,
            inProgressReferrals: 0,
            completedReferrals: 0,
            pendingReferrals: 0,
            rejectedReferrals: 0
          }
        };
      }
      return response.json();
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Dashboard</h1>

      <div className="flex justify-end">
        <ReferralForm />
      </div>

      <RewardsSnapshotWidget />

      <ReferralStatsWidget />

      <ClinicianBadges
        stats={{
          totalReferrals: stats?.statistics.totalReferrals || 0,
          inProgressReferrals: stats?.statistics.inProgressReferrals || 0,
          completedReferrals: stats?.statistics.completedReferrals || 0,
        }}
      />

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          <CardTitle>Recent Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No referrals yet. Start by submitting a new referral!</p>
        </CardContent>
      </Card>
    </div>
  );
}
