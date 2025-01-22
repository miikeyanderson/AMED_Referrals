import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trophy,
  TrendingUp,
  Clock,
  Users,
  ChevronUp,
  ChevronDown,
  Minus,
  Loader2
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TeamMetrics {
  totalReferrals: number;
  totalHires: number;
  timeToHire: number;
  conversionRate: number;
}

interface LeaderboardEntry {
  recruiterId: number;
  recruiterName: string;
  totalReferrals: number;
  totalHires: number;
  timeToHire: number;
  conversionRate: number;
}

interface TeamComparisonsData {
  userMetrics: TeamMetrics;
  teamAverages: TeamMetrics;
  leaderboard: LeaderboardEntry[];
}

function MetricComparison({ 
  label, 
  value, 
  average, 
  icon: Icon,
  unit = "",
  tooltip,
  reverseComparison = false
}: {
  label: string;
  value: number;
  average: number;
  icon: React.ElementType;
  unit?: string;
  tooltip: string;
  reverseComparison?: boolean;
}) {
  const difference = value - average;
  const percentageDiff = average !== 0 ? (difference / average) * 100 : 0;
  const isPositive = reverseComparison ? difference < 0 : difference > 0;
  const displayValue = unit === "days" ? Math.round(value) : value.toFixed(1);
  const displayAverage = unit === "days" ? Math.round(average) : average.toFixed(1);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                {label}
              </TooltipTrigger>
              <TooltipContent>
                <p className="w-[200px] text-sm">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <div className={`flex items-center gap-1 text-sm ${
          isPositive ? 'text-success' : difference < 0 ? 'text-destructive' : 'text-muted-foreground'
        }`}>
          {difference !== 0 ? (
            <>
              {isPositive ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {Math.abs(percentageDiff).toFixed(1)}%
            </>
          ) : (
            <Minus className="h-4 w-4" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {displayValue}{unit}
        </div>
        <Progress 
          value={value > 0 ? (value / Math.max(value, average) * 100) : 0} 
          className="mt-3"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Team Average: {displayAverage}{unit}
        </p>
      </CardContent>
    </Card>
  );
}

export function TeamComparisons() {
  const { data, isLoading } = useQuery<TeamComparisonsData>({
    queryKey: ["/api/recruiter/team-comparisons"],
  });

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Team Performance Comparison</CardTitle>
        <CardDescription>
          Your performance metrics compared to team averages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricComparison
            label="Total Hires"
            value={data.userMetrics.totalHires}
            average={data.teamAverages.totalHires}
            icon={Trophy}
            tooltip="Total number of successful hires made"
          />
          <MetricComparison
            label="Conversion Rate"
            value={data.userMetrics.conversionRate}
            average={data.teamAverages.conversionRate}
            icon={TrendingUp}
            unit="%"
            tooltip="Percentage of referrals that result in successful hires"
          />
          <MetricComparison
            label="Time to Hire"
            value={data.userMetrics.timeToHire}
            average={data.teamAverages.timeToHire}
            icon={Clock}
            unit=" days"
            tooltip="Average days from referral to hire"
            reverseComparison
          />
          <MetricComparison
            label="Total Referrals"
            value={data.userMetrics.totalReferrals}
            average={data.teamAverages.totalReferrals}
            icon={Users}
            tooltip="Total number of referrals processed"
          />
        </div>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recruiter</TableHead>
                  <TableHead className="text-right">Hires</TableHead>
                  <TableHead className="text-right">Conversion</TableHead>
                  <TableHead className="text-right">Time to Hire</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.leaderboard.map((entry) => (
                  <TableRow key={entry.recruiterId}>
                    <TableCell>{entry.recruiterName}</TableCell>
                    <TableCell className="text-right">{entry.totalHires}</TableCell>
                    <TableCell className="text-right">{entry.conversionRate.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{Math.round(entry.timeToHire)} days</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
