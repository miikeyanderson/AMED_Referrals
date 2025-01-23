import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Award, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Badge {
  id: string;
  name: string;
  description: string;
  criteria: string;
  icon: JSX.Element;
  threshold: number;
  color: string;
}

const badges: Badge[] = [
  {
    id: "first_referral",
    name: "First Steps",
    description: "Made your first referral",
    criteria: "Submit your first candidate referral",
    icon: <Award className="h-8 w-8" />,
    threshold: 1,
    color: "text-blue-500",
  },
  {
    id: "rising_star",
    name: "Rising Star",
    description: "5 successful referrals",
    criteria: "Have 5 referred candidates reach the interview stage",
    icon: <Award className="h-8 w-8" />,
    threshold: 5,
    color: "text-amber-500",
  },
  {
    id: "top_referrer",
    name: "Top Referrer",
    description: "10 successful placements",
    criteria: "Successfully place 10 referred candidates",
    icon: <Award className="h-8 w-8" />,
    threshold: 10,
    color: "text-emerald-500",
  },
];

interface ClinicianBadgesProps {
  stats: {
    totalReferrals: number;
    inProgressReferrals: number;
    completedReferrals: number;
  };
}

export function ClinicianBadges({ stats }: ClinicianBadgesProps) {
  const isBadgeUnlocked = (badge: Badge) => {
    switch (badge.id) {
      case "first_referral":
        return stats.totalReferrals >= badge.threshold;
      case "rising_star":
        return stats.inProgressReferrals >= badge.threshold;
      case "top_referrer":
        return stats.completedReferrals >= badge.threshold;
      default:
        return false;
    }
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>
            Track your referral milestones and unlock achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {badges.map((badge) => {
              const unlocked = isBadgeUnlocked(badge);
              return (
                <Tooltip key={badge.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex flex-col items-center p-4 rounded-lg border transition-colors",
                        unlocked
                          ? "bg-background cursor-help"
                          : "bg-muted cursor-not-allowed opacity-50"
                      )}
                    >
                      <div className={cn("mb-2", badge.color)}>
                        {unlocked ? badge.icon : <Lock className="h-8 w-8" />}
                      </div>
                      <h3 className="font-semibold">{badge.name}</h3>
                      <p className="text-sm text-muted-foreground text-center">
                        {badge.description}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">{badge.name}</p>
                    <p className="text-sm">{badge.criteria}</p>
                    {!unlocked && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Progress: {stats.totalReferrals}/{badge.threshold}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
