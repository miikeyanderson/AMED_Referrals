import { RewardsSnapshotWidget } from "@/components/RewardsSnapshotWidget";

export default function ClinicianDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Clinician Dashboard</h1>
      <div className="grid gap-6">
        <RewardsSnapshotWidget />
        {/* Add other dashboard widgets here */}
      </div>
    </div>
  );
}
