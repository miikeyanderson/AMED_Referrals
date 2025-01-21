import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function LeadershipDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Team Performance</h1>
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <CardTitle>Key Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add performance metrics component here */}
          <p className="text-muted-foreground">Loading team performance metrics...</p>
        </CardContent>
      </Card>
    </div>
  );
}
