import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { ReferralInflowWidget } from "@/components/dashboard/ReferralInflowWidget";
import { PipelineSnapshotWidget } from "@/components/dashboard/PipelineSnapshotWidget";
import { KPIGroupWidget } from "@/components/dashboard/KPIGroupWidget";
import { CandidatePipeline } from "@/components/dashboard/CandidatePipeline";
import { TeamComparisons } from "@/components/dashboard/recruiter/TeamComparisons";

export default function RecruiterDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>

      {/* KPI Group Widget */}
      <KPIGroupWidget />

      {/* Team Comparisons Widget */}
      <TeamComparisons />

      {/* Pipeline Snapshot Widget */}
      <PipelineSnapshotWidget />

      {/* Referral Inflow Widget */}
      <ReferralInflowWidget />

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Users className="h-5 w-5" />
          <CardTitle>Candidate Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <CandidatePipeline />
        </CardContent>
      </Card>
    </div>
  );
}