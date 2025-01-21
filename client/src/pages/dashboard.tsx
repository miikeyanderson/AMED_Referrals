import { Sidebar } from "@/components/dashboard/Sidebar";
import { useUser } from "@/hooks/use-user";
import { AnalyticsCard } from "@/components/dashboard/AnalyticsCard";
import { ReferralTable } from "@/components/dashboard/ReferralTable";
import { RewardTracker } from "@/components/dashboard/RewardTracker";

export default function Dashboard() {
  const { user } = useUser();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnalyticsCard
              title="Total Referrals"
              value="24"
              change="+12%"
              trend="up"
            />
            <AnalyticsCard
              title="Active Candidates"
              value="8"
              change="-3%"
              trend="down"
            />
            <AnalyticsCard
              title="Rewards Earned"
              value="$2,400"
              change="+8%"
              trend="up"
            />
          </div>

          {user?.role === 'clinician' && <RewardTracker />}
          
          <ReferralTable role={user?.role || 'clinician'} />
        </div>
      </main>
    </div>
  );
}
