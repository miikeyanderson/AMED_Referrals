import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";
import { ReferralStatsWidget } from "@/components/dashboard/ReferralStatsWidget";

export default function ClinicianDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Referrals</h1>

      <ReferralStatsWidget />

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          <CardTitle>Recent Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add referral list component here */}
          <p className="text-muted-foreground">No referrals yet. Start by submitting a new referral!</p>
        </CardContent>
      </Card>
    </div>
  );
}