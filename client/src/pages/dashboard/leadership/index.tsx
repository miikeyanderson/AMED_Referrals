
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function LeadershipDashboard() {
  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 md:px-8">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Team Performance</h1>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center gap-2 p-4 sm:p-6">
          <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
          <CardTitle className="text-base sm:text-lg md:text-xl">Key Metrics</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <p className="text-sm sm:text-base text-muted-foreground">Loading team performance metrics...</p>
        </CardContent>
      </Card>
    </div>
  );
}
