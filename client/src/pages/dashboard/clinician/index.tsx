import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, UserPlus, Gift, FileText, Users, Clock, Star } from "lucide-react";
import { ReferralStatsWidget } from "@/components/dashboard/ReferralStatsWidget";
import { ClinicianBadges } from "@/components/dashboard/ClinicianBadges";
import { RewardsSnapshotWidget } from "@/components/RewardsSnapshotWidget";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLocation } from "wouter";

interface QuickLink {
  icon: JSX.Element;
  label: string;
  description: string;
  href: string;
  color: string;
  priority?: number;
}

// Static quick links
const staticQuickLinks: QuickLink[] = [
  {
    icon: <UserPlus className="h-6 w-6" />,
    label: "New Referral",
    description: "Submit a new candidate referral",
    href: "/dashboard/clinician/refer",
    color: "bg-[hsl(var(--chart-2))] hover:bg-[hsl(var(--chart-2)_/_0.9)]"
  },
  {
    icon: <Clock className="h-6 w-6" />,
    label: "Pending Reviews",
    description: "Check status of pending referrals",
    href: "/dashboard/clinician/pending",
    color: "bg-[hsl(var(--chart-1))] hover:bg-[hsl(var(--chart-1)_/_0.9)]"
  },
  {
    icon: <Gift className="h-6 w-6" />,
    label: "My Rewards",
    description: "View and track your rewards",
    href: "/dashboard/clinician/rewards",
    color: "bg-[hsl(var(--chart-4))] hover:bg-[hsl(var(--chart-4)_/_0.9)]"
  },
  {
    icon: <FileText className="h-6 w-6" />,
    label: "Resources",
    description: "Access referral guidelines and tips",
    href: "/dashboard/clinician/resources",
    color: "bg-[hsl(var(--chart-5))] hover:bg-[hsl(var(--chart-5)_/_0.9)]"
  }
];

//New Docs page component
function DocsPage() {
  return (
    <div>
      <h1>App Documentation</h1>
      <p>This is the documentation page for the app.  Details on how to use the app will go here.</p>
      {/* Add more documentation content here */}
    </div>
  );
}


export default function ClinicianDashboard() {
  const { user } = useUser();
  const [, setLocation] = useLocation();

  // Fetch user's recent activities
  const { data: recentActivities } = useQuery({
    queryKey: ['/api/clinician/recent-activities'],
    queryFn: async () => {
      const response = await fetch('/api/clinician/recent-activities');
      if (!response.ok) {
        return [];
      }
      return response.json();
    }
  });

  // Fetch regular stats
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

  // Generate personalized quick links based on recent activities
  const getPersonalizedQuickLinks = () => {
    const personalizedLinks: QuickLink[] = [...staticQuickLinks];

    if (recentActivities?.length > 0) {
      // Add recent activity based links
      recentActivities.forEach((activity: any) => {
        switch (activity.type) {
          case 'view_referral':
            if (activity.metadata?.referralId) {
              personalizedLinks.unshift({
                icon: <Star className="h-6 w-6" />,
                label: `Return to Referral #${activity.metadata.referralId}`,
                description: "Continue where you left off",
                href: `/dashboard/clinician/referral/${activity.metadata.referralId}`,
                color: "bg-yellow-500 hover:bg-yellow-600",
                priority: 1
              });
            }
            break;
          // Add more activity types here
        }
      });
    }

    // Sort by priority and limit to 6 items
    return personalizedLinks
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, 6);
  };

  const quickLinks = getPersonalizedQuickLinks();

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 md:px-8">
      <div className="flex flex-col justify-start pb-6 animate-fade-in">
        <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight w-full">
          <div className="flex flex-wrap items-center gap-2 w-full">
            <div className="flex flex-wrap items-center gap-2 w-full">
              Your Next <span className="text-green-400 font-extrabold animate-pulse">$500</span> Is Waiting,
              <span className="text-blue-400 font-extrabold">{user?.name}</span>
            </div>
          </div>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground/80 mt-2">
          </p>
        <Button 
          size="default"
          variant="secondary" 
          className="mt-4 font-medium w-48"
          onClick={() => setLocation('/tips-to-get-started')}
        >
          Tips to Get Started
        </Button>
      </div>

      {/* Quick Links Section */}
      <div className="py-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Quick Links</h2>
          {recentActivities?.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Personalized based on your recent activity
            </p>
          )}
        </div>
        <TooltipProvider>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-1">
            {quickLinks.map((link) => (
              <Tooltip key={link.label}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => router.push(link.href)} // Use router.push for client-side navigation
                    className={`w-full p-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background ${
                      link.label === 'New Referral' 
                        ? 'bg-green-900/30 text-green-100 border border-green-200 hover:bg-green-900/40 focus:ring-green-200'
                        : link.label === 'Resources'
                        ? 'bg-blue-900/30 text-blue-100 border border-blue-200 hover:bg-blue-900/40 focus:ring-blue-200'
                        : link.label === 'Pending Reviews'
                        ? 'bg-yellow-900/30 text-yellow-100 border border-yellow-200 hover:bg-yellow-900/40 focus:ring-yellow-200'
                        : 'bg-red-900/30 text-red-100 border border-red-200 hover:bg-red-900/40 focus:ring-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {link.icon}
                      <div className="text-left">
                        <div className="font-semibold">{link.label}</div>
                        <div className="text-sm opacity-90">{link.description}</div>
                      </div>
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{link.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
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
          <p className="text-muted-foreground text-sm sm:text-base">No referrals yet. Start by submitting a new referral!</p>
        </CardContent>
      </Card>
    </div>
  );
}

//This is the new documentation page
export { DocsPage };