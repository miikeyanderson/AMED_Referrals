import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function LeadershipDashboard() {
  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 md:px-8">
      <h1 className="text-2xl sm:text-3xl font-bold">Team Performance</h1>
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 p-4 sm:p-6">
          <BarChart3 className="h-5 w-5" />
          <CardTitle className="text-lg sm:text-xl">Key Metrics</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {/* Add performance metrics component here */}
          <p className="text-muted-foreground text-sm sm:text-base">Loading team performance metrics...</p>
        </CardContent>
      </Card>
    </div>
  );
}
