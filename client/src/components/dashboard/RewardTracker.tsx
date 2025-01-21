import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function RewardTracker() {
  const currentRewards = 1200;
  const targetRewards = 2000;
  const progress = (currentRewards / targetRewards) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rewards Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>${currentRewards} earned</span>
            <span>${targetRewards} target</span>
          </div>
          <p className="text-sm text-muted-foreground">
            You're {Math.round(progress)}% of the way to your quarterly bonus!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
