import { Sidebar } from "@/components/dashboard/Sidebar";
import { useUser } from "@/hooks/use-user";
import { AnalyticsCard } from "@/components/dashboard/AnalyticsCard";
import { ReferralTable } from "@/components/dashboard/ReferralTable";
import { RewardTracker } from "@/components/dashboard/RewardTracker";
import { ReferralForm } from "@/components/dashboard/ReferralForm";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const { user } = useUser();

  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics'],
    queryFn: async () => {
      const response = await fetch('/api/analytics');
      if (!response.ok) {
        return {
          totalReferrals: '0',
          activeReferrals: '0',
          totalRewards: '$0',
          referralTrend: '0%',
          activeTrend: '0%',
          rewardsTrend: '0%',
        };
      }
      return response.json();
    },
  });

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">
              Welcome, {user?.name || user?.username}
            </h1>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnalyticsCard
              title="Total Referrals"
              value={analytics?.totalReferrals || '0'}
              change={analytics?.referralTrend || '0%'}
              trend={analytics?.referralTrend?.startsWith('-') ? 'down' : 'up'}
            />
            <AnalyticsCard
              title="Active Candidates"
              value={analytics?.activeReferrals || '0'}
              change={analytics?.activeTrend || '0%'}
              trend={analytics?.activeTrend?.startsWith('-') ? 'down' : 'up'}
            />
            <AnalyticsCard
              title="Rewards Earned"
              value={analytics?.totalRewards || '$0'}
              change={analytics?.rewardsTrend || '0%'}
              trend={analytics?.rewardsTrend?.startsWith('-') ? 'down' : 'up'}
            />
          </div>

          {user?.role === 'clinician' && <RewardTracker />}

          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Referrals</h2>
            <ReferralForm />
          </div>

          <ReferralTable role={user?.role || 'clinician'} />
        </div>
      </main>
    </div>
  );
}