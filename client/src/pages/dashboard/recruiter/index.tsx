import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { ReferralInflowWidget } from "@/components/dashboard/ReferralInflowWidget";
import { PipelineSnapshotWidget } from "@/components/dashboard/PipelineSnapshotWidget";
import { KPIGroupWidget } from "@/components/dashboard/KPIGroupWidget";
import { CandidatePipeline } from "@/components/dashboard/CandidatePipeline";

export default function RecruiterDashboard() {
  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6 lg:p-8 max-w-[100vw] overflow-x-hidden">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Recruiter Dashboard</h1>

      {/* KPI Group Widget */}
      <KPIGroupWidget />

      {/* Candidate Pipeline */}
      <Card className="w-full mx-auto">
        <CardHeader className="flex flex-row items-center gap-2 p-3 sm:p-4 md:p-6">
          <Users className="h-5 w-5" />
          <CardTitle className="text-lg sm:text-xl">Candidate Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-3 md:p-4 lg:p-6">
          <CandidatePipeline />
        </CardContent>
      </Card>

      {/* Pipeline Snapshot and Referral Inflow Widgets */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 w-full max-w-[1440px] mx-auto">
        <div className="w-full min-h-[350px] sm:min-h-[400px] lg:min-h-[500px]">
          <PipelineSnapshotWidget />
        </div>
        <div className="w-full min-h-[350px] sm:min-h-[400px] lg:min-h-[500px]">
          <ReferralInflowWidget />
        </div>
      </div>
    </div>
  );
}