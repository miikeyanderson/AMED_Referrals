import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";
import { ReferralStatsWidget } from "@/components/dashboard/ReferralStatsWidget";
import { ClinicianBadges } from "@/components/dashboard/ClinicianBadges";
import { RewardsSnapshotWidget } from "@/components/RewardsSnapshotWidget";
import { useQuery } from "@tanstack/react-query";
import { Gift } from "lucide-react";
import { useUser } from "@/hooks/use-user";

export default function ClinicianDashboard() {
  const { user } = useUser();
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
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 md:px-8">
      <div className="flex flex-col justify-start pb-6 animate-fade-in">
        <div className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">
          <div className="flex flex-wrap items-center gap-2">
            Your Next <span className="text-green-400 font-extrabold animate-pulse">$500</span> Is Waiting,
            <span className="text-lg sm:text-xl md:text-2xl font-medium">{user?.name}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground/80 mt-2">
          Make a referral today to claim your reward
        </p>
        <button 
          onClick={() => window.location.href = '/dashboard/clinician/refer'}
          className="mt-4 px-6 py-2 bg-green-500 text-white font-medium rounded-full hover:bg-green-600 transition-colors duration-200 shadow-sm"
        >
          Refer Now
        </button>
      </div>
      
      <h1 className="text-2xl sm:text-3xl font-bold">My Dashboard</h1>

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
        <CardHeader className="flex flex-row items-center gap-2 p-4 sm:p-6">
          <ClipboardList className="h-5 w-5" />
          <CardTitle className="text-lg sm:text-xl">Recent Referrals</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {/* Add referral list component here */}
          <p className="text-muted-foreground text-sm sm:text-base">No referrals yet. Start by submitting a new referral!</p>
        </CardContent>
      </Card>
    </div>
  );
}