import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, ChevronLeft, ChevronRight, ClipboardList, Gift, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface PlatformTourProps {
  onComplete: () => void;
}

const tourSteps = [
  {
    title: "Making Referrals",
    description: "Learn how to submit and track patient referrals through our platform.",
    icon: ClipboardList,
    content: (
      <div className="space-y-4">
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
      </div>
    ),
  },
  {
    title: "Track Progress",
    description: "Monitor your referrals and stay updated on their status.",
    icon: Users,
    content: (
      <div className="space-y-4">
        <h4 className="font-medium">Referral Dashboard Features:</h4>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            Real-time status updates
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            Detailed referral history
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            Communication logs with specialists
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Stay informed about your referrals' progress and maintain clear communication
          channels with all parties involved.
        </p>
      </div>
    ),
  },
  {
    title: "Earn Rewards",
    description: "Understand our rewards program and how to earn points.",
    icon: Gift,
    content: (
      <div className="space-y-4">
        <h4 className="font-medium">Rewards Program Benefits:</h4>
        <div className="grid gap-3">
          <div className="rounded-lg border p-3">
            <h5 className="font-medium mb-1">Quality Referrals</h5>
            <p className="text-sm text-muted-foreground">
              Earn points for complete and accurate referral submissions
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <h5 className="font-medium mb-1">Successful Matches</h5>
            <p className="text-sm text-muted-foreground">
              Additional rewards for referrals that lead to successful placements
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <h5 className="font-medium mb-1">Redemption Options</h5>
            <p className="text-sm text-muted-foreground">
              Convert points into various rewards including professional development opportunities
            </p>
          </div>
        </div>
      </div>
    ),
  },
];

export function PlatformTour({ onComplete }: PlatformTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep === tourSteps.length - 1) {
      onComplete();
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        {tourSteps.map((step, index) => (
          <button
            key={index}
            className={cn(
              "flex-1 p-4 rounded-lg border transition-colors",
              currentStep === index
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50"
            )}
            onClick={() => setCurrentStep(index)}
          >
            <step.icon className={cn(
              "h-6 w-6 mb-2",
              currentStep === index ? "text-primary" : "text-muted-foreground"
            )} />
            <h3 className="font-medium text-sm">{step.title}</h3>
            <p className="text-xs text-muted-foreground">{step.description}</p>
          </button>
        ))}
      </div>

      <ScrollArea className="h-[300px] rounded-md border">
        <div className="p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {tourSteps[currentStep].content}
            </motion.div>
          </AnimatePresence>
        </div>
      </ScrollArea>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button onClick={handleNext}>
          {currentStep === tourSteps.length - 1 ? (
            "Complete Tour"
          ) : (
            <>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
