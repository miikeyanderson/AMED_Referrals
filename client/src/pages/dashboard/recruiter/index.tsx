import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { ReferralInflowWidget } from "@/components/dashboard/ReferralInflowWidget";
import { PipelineSnapshotWidget } from "@/components/dashboard/PipelineSnapshotWidget";
import { KPIGroupWidget } from "@/components/dashboard/KPIGroupWidget";

export default function RecruiterDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>

      {/* KPI Group Widget */}
      <KPIGroupWidget />

      {/* Pipeline Snapshot Widget */}
      <PipelineSnapshotWidget />

      {/* Referral Inflow Widget */}
      <ReferralInflowWidget />

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Users className="h-5 w-5" />
          <CardTitle>Active Candidates</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add candidate pipeline component here */}
          <p className="text-muted-foreground">No active candidates in the pipeline.</p>
        </CardContent>
      </Card>
    </div>
  );
}