import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { AnimatePresence, motion } from "framer-motion";
import type { OnboardingStepType } from "@/types/onboarding";
import { useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Users, BadgeDollarSign, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { WelcomeStep } from "./steps/WelcomeStep";
import { ProfileSetup } from "./steps/ProfileSetup";
import { WalkthroughStep } from "./steps/WalkthroughStep";
import { FeatureTourStep } from "./steps/FeatureTourStep";
import { CallToActionStep } from "./steps/CallToActionStep";

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  {
    id: "welcome",
    title: "Welcome to ARM Platform",
    description: "Get started with healthcare referrals",
  },
  {
    id: "profile_creation",
    title: "Profile Setup",
    description: "Tell us about your expertise",
  },
  {
    id: "walkthrough",
    title: "How It Works",
    description: "Learn the referral process",
  },
  {
    id: "feature_tour",
    title: "Platform Tour",
    description: "Discover key features",
  },
  {
    id: "call_to_action",
    title: "Start Earning",
    description: "Make your first referral",
  },
] as const;

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const { user, updateOnboardingStep } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<OnboardingStepType>(
    user?.currentOnboardingStep || "welcome"
  );

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = async () => {
    const nextStep = steps[currentStepIndex + 1];
    if (!nextStep) {
      try {
        await updateOnboardingStep("completed");
        await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        toast({
          title: "Welcome aboard!",
          description: "You're all set to start referring healthcare professionals.",
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
      <DialogContent className="sm:max-w-[600px] p-0">
        <div className="flex flex-col">
          <DialogTitle className="sr-only">Onboarding</DialogTitle>
          <DialogTitle className="sr-only">Onboarding</DialogTitle>
          <div className="p-6 space-y-4">
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
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="px-6 pb-6"
            >
              {currentStep === "welcome" && <WelcomeStep onNext={handleNext} />}
              {currentStep === "profile_creation" && (
                <ProfileSetup onComplete={handleNext} />
              )}
              {currentStep === "walkthrough" && (
                <WalkthroughStep onComplete={handleNext} />
              )}
              {currentStep === "feature_tour" && (
                <FeatureTourStep onComplete={handleNext} />
              )}
              {currentStep === "call_to_action" && (
                <CallToActionStep onComplete={handleNext} />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="border-t p-6 flex justify-between items-center bg-muted/40">
            <Button variant="ghost" onClick={handleSkip} size="sm">
              Skip for now
            </Button>
            <div className="flex items-center gap-2">
              {currentStepIndex < steps.length - 1 ? (
                <Button onClick={handleNext} className="gap-2">
                  Next Step
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleNext} className="gap-2">
                  Complete Setup
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}