import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { AnimatePresence, motion } from "framer-motion";
import { ProfileSetup } from "./steps/ProfileSetup";
import { Preferences } from "./steps/Preferences";
import { PlatformTour } from "./steps/PlatformTour";
import type { OnboardingStepType } from "@/types/onboarding";
import { CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  {
    id: "profile_creation",
    title: "Profile Setup",
    description: "Let's set up your professional profile",
  },
  {
    id: "document_verification",
    title: "Preferences",
    description: "Customize your notification settings",
  },
  {
    id: "compliance_training",
    title: "Platform Tour",
    description: "Learn how to use the platform",
  },
] as const;

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const { user, updateOnboardingStep } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<OnboardingStepType>(
    user?.currentOnboardingStep || "profile_creation"
  );

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = async () => {
    const nextStep = steps[currentStepIndex + 1];
    if (!nextStep) {
      // Complete onboarding
      try {
        await updateOnboardingStep("completed");
        await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        toast({
          title: "Onboarding Complete",
          description: "Welcome to the ARM Platform!",
        });
        onOpenChange(false);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to complete onboarding. Please try again.",
        });
      }
      return;
    }

    try {
      await updateOnboardingStep(nextStep.id as OnboardingStepType);
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setCurrentStep(nextStep.id as OnboardingStepType);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update progress. Please try again.",
      });
    }
  };

  const handleSkip = async () => {
    try {
      await updateOnboardingStep("completed");
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Onboarding Skipped",
        description: "You can complete your profile later from settings.",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to skip onboarding. Please try again.",
      });
    }
  };

  useEffect(() => {
    if (user?.currentOnboardingStep === "completed") {
      onOpenChange(false);
    }
  }, [user?.currentOnboardingStep, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              {steps[currentStepIndex].title}
            </h2>
            <p className="text-muted-foreground">
              {steps[currentStepIndex].description}
            </p>
          </div>

          <div className="relative">
            <Progress value={progress} className="h-2" />
            <span className="absolute right-0 top-4 text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep === "profile_creation" && (
                <ProfileSetup onComplete={handleNext} />
              )}
              {currentStep === "document_verification" && (
                <Preferences onComplete={handleNext} />
              )}
              {currentStep === "compliance_training" && (
                <PlatformTour onComplete={handleNext} />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={handleSkip}>
              Skip for now
            </Button>
            {currentStep === "compliance_training" && (
              <Button onClick={handleNext} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Complete Onboarding
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}