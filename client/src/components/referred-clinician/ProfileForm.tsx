import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { referredClinicianSubmissionSchema } from "@db/schema";
import type { z } from "zod";
import { format } from "date-fns";

// Extend the schema type to include resumeFile for form handling
type FormData = z.infer<typeof referredClinicianSubmissionSchema> & {
  resumeFile?: File;
};

interface ProfileFormProps {
  referralToken: string;
  defaultEmail?: string;
}

export function ProfileForm({ referralToken, defaultEmail }: ProfileFormProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<FormData>({
    resolver: zodResolver(referredClinicianSubmissionSchema),
    defaultValues: {
      email: defaultEmail || "",
      certifications: [],
      preferredLocations: [],
      yearsOfExperience: 0,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormData) => {
      // Handle file upload first if a file is selected
      if (data.resumeFile) {
        const formData = new FormData();
        formData.append("file", data.resumeFile);

        const uploadResponse = await fetch("/api/upload-resume", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload resume");
        }

        const { url } = await uploadResponse.json();
        data.resumeUrl = url;
      }

      // Remove resumeFile from data before sending to API
      const { resumeFile, ...submissionData } = data;

      // Submit the form data
      const response = await fetch(`/api/clinician/profile?token=${referralToken}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit profile");
      }

      return response.json();
    },
    onSuccess: () => {
      setLocation("/referred-clinician/thank-you");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutate(data))} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input {...field} type="tel" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specialty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Specialty</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="yearsOfExperience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Years of Experience</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="number" 
                  onChange={e => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="certifications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Certifications</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter certifications separated by commas" 
                  onChange={(e) => field.onChange(e.target.value.split(',').map(c => c.trim()))}
                  value={field.value?.join(', ') || ''}
                />
              </FormControl>
              <FormDescription>
                Enter your certifications separated by commas
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="currentEmployer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Employer (Optional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="preferredLocations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Locations</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter locations separated by commas" 
                  onChange={(e) => field.onChange(e.target.value.split(',').map(l => l.trim()))}
                  value={field.value?.join(', ') || ''}
                />
              </FormControl>
              <FormDescription>
                Enter your preferred work locations separated by commas
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="availabilityDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Availability Date</FormLabel>
              <FormControl>
                <Input 
                  type="date" 
                  {...field}
                  onChange={(e) => field.onChange(format(new Date(e.target.value), 'yyyy-MM-dd'))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="resumeFile"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Resume</FormLabel>
              <FormControl>
                <Input 
                  type="file" 
                  accept=".pdf,.doc,.docx" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onChange(file);
                    }
                  }}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Upload your resume (PDF, DOC, or DOCX format)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="additionalNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? "Submitting..." : "Submit Profile"}
        </Button>
      </form>
    </Form>
  );
}