import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const specialties = [
  "Registered Nurse (RN)",
  "Licensed Practical Nurse (LPN)",
  "Nurse Practitioner (NP)",
  "Clinical Nurse Specialist (CNS)",
  "Physician Assistant (PA)",
  "Medical Doctor (MD)",
  "Physical Therapist (PT)",
  "Occupational Therapist (OT)",
];

const certifications = [
  "BLS (Basic Life Support)",
  "ACLS (Advanced Cardiac Life Support)",
  "PALS (Pediatric Advanced Life Support)",
  "CCRN (Critical Care Registered Nurse)",
  "Other"
];

interface FormData {
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  position: string;
  department: string;
  specialty: string;
  certifications: string[];
  startDate: Date | null;
  experience: string;
  notes: string;
}

interface ReferralFormContentProps {
  isEmbedded?: boolean;
  onSubmitSuccess?: () => void;
}

function ReferralFormContent({ isEmbedded, onSubmitSuccess }: ReferralFormContentProps) {
  const [step, setStep] = useState(1);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    candidateName: "",
    candidateEmail: "",
    candidatePhone: "",
    position: "",
    department: "",
    specialty: "",
    certifications: [],
    startDate: null,
    experience: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Rest of the form logic and validation code...

  return (
    <div className={cn("py-4", isEmbedded && "bg-card rounded-lg shadow-sm p-6")}>
      <div className="mb-8">
        <Progress value={(step / 3) * 100} className="h-2" />
        <div className="flex justify-between text-sm mt-2">
          <span className={step >= 1 ? "text-primary" : "text-muted-foreground"}>
            Colleague Details
          </span>
          <span className={step >= 2 ? "text-primary" : "text-muted-foreground"}>
            Professional Info
          </span>
          <span className={step >= 3 ? "text-primary" : "text-muted-foreground"}>
            Additional Info
          </span>
        </div>
      </div>

      <div className="min-h-[400px]">{renderStep()}</div>

      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={step === 1}
        >
          Previous
        </Button>
        {step < 3 ? (
          <Button onClick={nextStep}>Next</Button>
        ) : (
          <Button
            onClick={() => {
              if (validateStep(3)) {
                mutate(formData);
                if (onSubmitSuccess) {
                  onSubmitSuccess();
                }
              }
            }}
            disabled={isLoading}
          >
            {isLoading ? "Submitting..." : "Submit Referral"}
          </Button>
        )}
      </div>
    </div>
  );
}

export function ReferralForm() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    candidateName: "",
    candidateEmail: "",
    candidatePhone: "",
    position: "",
    department: "",
    specialty: "",
    certifications: [],
    startDate: null,
    experience: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string | string[] | Date | null) => {
    switch (name) {
      case 'candidateName':
        return value.toString().length < 2 ? 'Name must be at least 2 characters' : '';
      case 'candidateEmail':
        return !value.toString().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) ? 'Invalid email format' : '';
      case 'candidatePhone':
        return !value.toString().match(/^\+?[\d\s-]{10,}$/) ? 'Invalid phone number' : '';
      case 'position':
        return !value ? 'Position is required' : '';
      case 'department':
        return !value ? 'Department is required' : '';
      case 'specialty':
        return !value ? 'Specialty is required' : '';
      case 'startDate':
        return !value ? 'Start date is required' : '';
      default:
        return '';
    }
  };

  const handleChange = (
    name: keyof FormData,
    value: string | string[] | Date | null
  ) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateStep = (stepNumber: number) => {
    const fieldsToValidate: Record<number, (keyof FormData)[]> = {
      1: ['candidateName', 'candidateEmail', 'candidatePhone'],
      2: ['position', 'department', 'specialty'],
      3: ['startDate']
    };

    const currentStepFields = fieldsToValidate[stepNumber] || [];
    const newErrors: Record<string, string> = {};

    currentStepFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const { mutate, isLoading } = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create referral");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referrals"] });
      toast({
        title: "Success!",
        description: "Referral submitted successfully.",
      });
      setOpen(false);
      setStep(1);
      setFormData({
        candidateName: "",
        candidateEmail: "",
        candidatePhone: "",
        position: "",
        department: "",
        specialty: "",
        certifications: [],
        startDate: null,
        experience: "",
        notes: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit referral. Please try again.",
        variant: "destructive",
      });
    },
  });

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Colleague Details</h3>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Full Name"
                  value={formData.candidateName}
                  onChange={(e) => handleChange("candidateName", e.target.value)}
                  className={errors.candidateName ? "border-red-500" : ""}
                />
                {errors.candidateName && (
                  <p className="text-sm text-red-500 mt-1">{errors.candidateName}</p>
                )}
              </div>
              <div>
                <Input
                  placeholder="Email Address"
                  type="email"
                  value={formData.candidateEmail}
                  onChange={(e) => handleChange("candidateEmail", e.target.value)}
                  className={errors.candidateEmail ? "border-red-500" : ""}
                />
                {errors.candidateEmail && (
                  <p className="text-sm text-red-500 mt-1">{errors.candidateEmail}</p>
                )}
              </div>
              <div>
                <Input
                  placeholder="Phone Number"
                  value={formData.candidatePhone}
                  onChange={(e) => handleChange("candidatePhone", e.target.value)}
                  className={errors.candidatePhone ? "border-red-500" : ""}
                />
                {errors.candidatePhone && (
                  <p className="text-sm text-red-500 mt-1">{errors.candidatePhone}</p>
                )}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Professional Information</h3>
            <div className="space-y-4">
              <div>
                <Select
                  value={formData.specialty}
                  onValueChange={(value) => handleChange("specialty", value)}
                >
                  <SelectTrigger className={errors.specialty ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select Specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.specialty && (
                  <p className="text-sm text-red-500 mt-1">{errors.specialty}</p>
                )}
              </div>
              <div>
                <Select
                  value={formData.department}
                  onValueChange={(value) => handleChange("department", value)}
                >
                  <SelectTrigger className={errors.department ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                    <SelectItem value="ICU">ICU</SelectItem>
                    <SelectItem value="Surgery">Surgery</SelectItem>
                    <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                    <SelectItem value="Oncology">Oncology</SelectItem>
                  </SelectContent>
                </Select>
                {errors.department && (
                  <p className="text-sm text-red-500 mt-1">{errors.department}</p>
                )}
              </div>
              <div>
                <Input
                  placeholder="Position/Role"
                  value={formData.position}
                  onChange={(e) => handleChange("position", e.target.value)}
                  className={errors.position ? "border-red-500" : ""}
                />
                {errors.position && (
                  <p className="text-sm text-red-500 mt-1">{errors.position}</p>
                )}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Additional Information</h3>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Preferred Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground",
                        errors.startDate && "border-red-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? (
                        format(formData.startDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate || undefined}
                      onSelect={(date) => handleChange("startDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.startDate && (
                  <p className="text-sm text-red-500">{errors.startDate}</p>
                )}
              </div>
              <div>
                <Textarea
                  placeholder="Experience and Skills..."
                  value={formData.experience}
                  onChange={(e) => handleChange("experience", e.target.value)}
                  className="h-20"
                />
              </div>
              <div>
                <Textarea
                  placeholder="Additional Notes..."
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  className="h-20"
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add New Referral</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Referral</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="mb-8">
            <Progress value={(step / 3) * 100} className="h-2" />
            <div className="flex justify-between text-sm mt-2">
              <span className={step >= 1 ? "text-primary" : "text-muted-foreground"}>
                Colleague Details
              </span>
              <span className={step >= 2 ? "text-primary" : "text-muted-foreground"}>
                Professional Info
              </span>
              <span className={step >= 3 ? "text-primary" : "text-muted-foreground"}>
                Additional Info
              </span>
            </div>
          </div>

          <div className="min-h-[400px]">{renderStep()}</div>

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
            >
              Previous
            </Button>
            {step < 3 ? (
              <Button onClick={nextStep}>Next</Button>
            ) : (
              <Button
                onClick={() => validateStep(3) && mutate(formData)}
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Submit Referral"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}