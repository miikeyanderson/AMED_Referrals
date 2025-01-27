import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, ChartBar, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureTourStepProps {
  onComplete: () => void;
}

const features = [
  {
    Icon: FileText,
    title: "Submit Referral",
    description: "Click here to refer your colleagues. Fill out their information and we'll take it from there!",
    colorClass: "bg-primary/10 text-primary",
  },
  {
    Icon: ChartBar,
    title: "Track Progress",
    description: "Monitor your referrals' journey through our recruitment pipeline in real-time.",
    colorClass: "bg-blue-500/10 text-blue-500",
  },
  {
    Icon: Trophy,
    title: "Rewards Center",
    description: "View and redeem your rewards after successful placements.",
    colorClass: "bg-amber-500/10 text-amber-500",
  },
];

export function FeatureTourStep({ onComplete }: FeatureTourStepProps) {
  const [currentFeature, setCurrentFeature] = useState(0);

  const nextFeature = () => {
    if (currentFeature === features.length - 1) {
      onComplete();
    } else {
      setCurrentFeature(currentFeature + 1);
    }
  };

  const CurrentIcon = features[currentFeature].Icon;

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentFeature}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="min-h-[300px]"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={cn("rounded-full p-2", features[currentFeature].colorClass)}>
                  <CurrentIcon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>{features[currentFeature].title}</CardTitle>
                  <CardDescription>Step {currentFeature + 1} of {features.length}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {features[currentFeature].description}
              </p>

              <div className="mt-6">
                <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
                  {/* Placeholder for feature screenshot/demo */}
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    Feature Preview
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between items-center">
        <div className="flex gap-1">
          {features.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1.5 w-8 rounded-full transition-colors",
                index === currentFeature ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        <Button onClick={nextFeature}>
          {currentFeature === features.length - 1 ? "Complete Tour" : "Next Feature"}
        </Button>
      </div>
    </div>
  );
}