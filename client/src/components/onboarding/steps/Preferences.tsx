import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PreferencesSchema, type PreferencesData } from "@/types/onboarding";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Bell } from "lucide-react";

interface PreferencesProps {
  onComplete: () => void;
}

const AVAILABILITY_HOURS = [
  "09:00-17:00",
  "10:00-18:00",
  "12:00-20:00",
  "14:00-22:00",
  "Flexible",
];

export function Preferences({ onComplete }: PreferencesProps) {
  const { toast } = useToast();

  const form = useForm<PreferencesData>({
    resolver: zodResolver(PreferencesSchema),
    defaultValues: {
      notificationEmail: true,
      notificationSMS: false,
      notificationInApp: true,
      preferredContactMethod: "email",
      availabilityHours: ["09:00-17:00"],
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: PreferencesData) => {
      const response = await fetch("/api/clinician/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Preferences Updated",
        description: "Your notification preferences have been saved.",
      });
      onComplete();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update preferences",
      });
    },
  });

  const onSubmit = (data: PreferencesData) => {
    updatePreferencesMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Notification Preferences</h3>
          </div>

          <FormField
            control={form.control}
            name="notificationEmail"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Email Notifications</FormLabel>
                  <FormDescription>
                    Receive updates and alerts via email
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notificationSMS"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">SMS Notifications</FormLabel>
                  <FormDescription>
                    Get urgent updates via text message
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notificationInApp"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">In-App Notifications</FormLabel>
                  <FormDescription>
                    See updates while using the platform
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="preferredContactMethod"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Preferred Contact Method</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="email" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Email Only
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="phone" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Phone Only
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="both" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Both Email and Phone
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="availabilityHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Availability Hours</FormLabel>
              <Select
                onValueChange={(value) => field.onChange([value])}
                defaultValue={field.value[0]}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your availability" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {AVAILABILITY_HOURS.map((hours) => (
                    <SelectItem key={hours} value={hours}>
                      {hours}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={updatePreferencesMutation.isPending}
        >
          {updatePreferencesMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </form>
    </Form>
  );
}
