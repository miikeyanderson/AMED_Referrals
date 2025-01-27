import { z } from "zod";

export const OnboardingStep = z.enum([
  "welcome",
  "profile_creation",
  "walkthrough",
  "feature_tour",
  "call_to_action",
  "completed"
]);

export type OnboardingStepType = z.infer<typeof OnboardingStep>;

export const ProfileSetupSchema = z.object({
  avatar: z.string().optional(),
  bio: z.string().min(10, "Bio must be at least 10 characters long"),
  specialties: z.array(z.string()).min(1, "Select at least one specialty"),
  yearsOfExperience: z.number().min(0, "Years of experience must be 0 or greater"),
});

export const PreferencesSchema = z.object({
  notificationEmail: z.boolean().default(true),
  notificationSMS: z.boolean().default(false),
  notificationInApp: z.boolean().default(true),
  preferredContactMethod: z.enum(["email", "phone", "both"]),
  availabilityHours: z.array(z.string()),
});

export type ProfileSetupData = z.infer<typeof ProfileSetupSchema>;
export type PreferencesData = z.infer<typeof PreferencesSchema>;

export interface OnboardingState {
  currentStep: OnboardingStepType;
  progress: {
    welcome: boolean;
    profile: boolean;
    walkthrough: boolean;
    featureTour: boolean;
    callToAction: boolean;
  };
}

export interface BenefitItem {
  icon: string;
  title: string;
  description: string;
}

export interface WalkthroughStep {
  title: string;
  description: string;
  icon: string;
}

export interface FeatureTourStep {
  element: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}