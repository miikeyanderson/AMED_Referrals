
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Gift, Users } from "lucide-react";

export default function TipsToGetStarted() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Platform Documentation</h1>
      
      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-primary" />
              <CardTitle>Making Referrals</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <h4 className="font-medium">Simple 3-Step Process:</h4>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Click "New Referral" in the dashboard</li>
              <li>Fill in patient and referral details</li>
              <li>Submit and track the referral status</li>
            </ol>
            <p className="text-sm text-muted-foreground">
              Our platform streamlines the referral process, ensuring efficient patient care coordination
              while maintaining compliance with healthcare regulations.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle>Tracking Progress</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <h4 className="font-medium">Dashboard Features:</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Monitor referral status in real-time</li>
              <li>• View detailed referral history</li>
              <li>• Access communication logs with specialists</li>
              <li>• Track patient outcomes</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gift className="h-6 w-6 text-primary" />
              <CardTitle>Rewards Program</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <h4 className="font-medium">Earning Points:</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Complete and accurate referral submissions</li>
              <li>• Successful patient placements</li>
              <li>• Positive feedback from specialists</li>
              <li>• Regular platform engagement</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
