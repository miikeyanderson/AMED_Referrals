import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { CalendarIcon, Upload, X, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

interface FileWithPreview extends File {
  preview?: string;
}

type FormStep = "details" | "documents" | "review";

export function ReferralForm() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<FormStep>("details");
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    candidateName: "",
    candidateEmail: "",
    candidatePhone: "",
    position: "",
    department: "",
    certifications: [] as string[],
    preferredStartDate: null as Date | null,
    experience: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: certificationsList } = useQuery({
    queryKey: ["/api/certifications"],
    queryFn: async () => {
      const response = await fetch("/api/certifications");
      if (!response.ok) return [];
      return response.json();
    },
  });

  const validateField = (name: string, value: string | string[] | Date | null) => {
    switch (name) {
      case 'candidateName':
        return value && typeof value === 'string' && value.length >= 2 ? '' : 'Name must be at least 2 characters';
      case 'candidateEmail':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value as string) ? '' : 'Invalid email format';
      case 'candidatePhone':
        return value && typeof value === 'string' && /^\+?[\d\-\(\)\s]{10,}$/.test(value) ? '' : 'Invalid phone number';
      case 'position':
        return value ? '' : 'Position is required';
      case 'department':
        return value ? '' : 'Department is required';
      case 'preferredStartDate':
        return value ? '' : 'Start date is required';
      default:
        return '';
    }
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (step === "details") {
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'notes' && key !== 'certifications') {
          const error = validateField(key, value);
          if (error) newErrors[key] = error;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []).slice(0, 3 - files.length);
    if (newFiles.length + files.length > 3) {
      toast({
        title: "Maximum files exceeded",
        description: "You can only upload up to 3 files",
        variant: "destructive",
      });
      return;
    }

    const validFiles = newFiles.filter(file => {
      const isValidType = ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB

      if (!isValidType || !isValidSize) {
        toast({
          title: "Invalid file",
          description: `${file.name} must be PDF, JPEG, or PNG and under 5MB`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).slice(0, 3 - files.length);
    handleFileChange({ target: { files: droppedFiles } } as any);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/referrals", {
        method: "POST",
        body: data,
      });
      if (!response.ok) throw new Error("Failed to create referral");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referrals"] });
      toast({
        title: "Success",
        description: "Referral submitted successfully",
      });
      setOpen(false);
      setStep("details");
      setFormData({
        candidateName: "",
        candidateEmail: "",
        candidatePhone: "",
        position: "",
        department: "",
        certifications: [],
        preferredStartDate: null,
        experience: "",
        notes: "",
      });
      setFiles([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit referral. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async () => {
    if (step !== "review") return;

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'certifications') {
        formDataToSend.append(key, JSON.stringify(value));
      } else if (key === 'preferredStartDate' && value) {
        formDataToSend.append(key, (value as Date).toISOString());
      } else {
        formDataToSend.append(key, String(value));
      }
    });

    files.forEach((file, index) => {
      formDataToSend.append(`file${index + 1}`, file);
    });

    mutate(formDataToSend);
  };

  const getStepProgress = () => {
    switch (step) {
      case "details":
        return 33;
      case "documents":
        return 66;
      case "review":
        return 100;
    }
  };

  const nextStep = () => {
    if (step === "details" && validateStep()) {
      setStep("documents");
    } else if (step === "documents") {
      setStep("review");
    }
  };

  const prevStep = () => {
    if (step === "documents") {
      setStep("details");
    } else if (step === "review") {
      setStep("documents");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add New Referral</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Referral</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Progress value={getStepProgress()} className="w-full" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span className={step === "details" ? "text-primary" : ""}>Details</span>
            <span className={step === "documents" ? "text-primary" : ""}>Documents</span>
            <span className={step === "review" ? "text-primary" : ""}>Review</span>
          </div>

          {step === "details" && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="candidateName">Candidate Name</Label>
                  <Input
                    id="candidateName"
                    name="candidateName"
                    placeholder="Full Name"
                    value={formData.candidateName}
                    onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                    className={errors.candidateName ? "border-red-500" : ""}
                  />
                  {errors.candidateName && (
                    <p className="text-sm text-red-500">{errors.candidateName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="candidateEmail">Email</Label>
                  <Input
                    id="candidateEmail"
                    name="candidateEmail"
                    type="email"
                    placeholder="Email"
                    value={formData.candidateEmail}
                    onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })}
                    className={errors.candidateEmail ? "border-red-500" : ""}
                  />
                  {errors.candidateEmail && (
                    <p className="text-sm text-red-500">{errors.candidateEmail}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="candidatePhone">Phone Number</Label>
                  <Input
                    id="candidatePhone"
                    name="candidatePhone"
                    placeholder="Phone"
                    value={formData.candidatePhone}
                    onChange={(e) => setFormData({ ...formData, candidatePhone: e.target.value })}
                    className={errors.candidatePhone ? "border-red-500" : ""}
                  />
                  {errors.candidatePhone && (
                    <p className="text-sm text-red-500">{errors.candidatePhone}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Preferred Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.preferredStartDate && "text-muted-foreground",
                          errors.preferredStartDate && "border-red-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.preferredStartDate ? (
                          format(formData.preferredStartDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.preferredStartDate || undefined}
                        onSelect={(date) => setFormData({ ...formData, preferredStartDate: date })}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Certifications</Label>
                <div className="grid grid-cols-2 gap-2">
                  {certificationsList?.map((cert: string) => (
                    <div key={cert} className="flex items-center space-x-2">
                      <Checkbox
                        id={cert}
                        checked={formData.certifications.includes(cert)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              certifications: [...formData.certifications, cert],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              certifications: formData.certifications.filter((c) => c !== cert),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={cert}>{cert}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  name="position"
                  placeholder="Position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className={errors.position ? "border-red-500" : ""}
                />
                {errors.position && (
                  <p className="text-sm text-red-500">{errors.position}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  name="department"
                  placeholder="Department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className={errors.department ? "border-red-500" : ""}
                />
                {errors.department && (
                  <p className="text-sm text-red-500">{errors.department}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Experience</Label>
                <Textarea
                  id="experience"
                  name="experience"
                  placeholder="Relevant experience..."
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === "documents" && (
            <div className="space-y-4 py-4">
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2">
                  Drag and drop files here or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  PDF, JPEG, or PNG (max 5MB each)
                </p>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-secondary rounded-lg"
                    >
                      <span className="truncate max-w-[200px]">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Any additional information..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p>{formData.candidateName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p>{formData.candidateEmail}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p>{formData.candidatePhone}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Start Date</Label>
                    <p>
                      {formData.preferredStartDate
                        ? format(formData.preferredStartDate, "PPP")
                        : "Not specified"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Position</Label>
                    <p>{formData.position}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Department</Label>
                    <p>{formData.department}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Certifications</Label>
                  <p>{formData.certifications.join(", ") || "None"}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Experience</Label>
                  <p>{formData.experience || "Not provided"}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Documents</Label>
                  <p>{files.length > 0 ? `${files.length} file(s) attached` : "No files attached"}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p>{formData.notes || "No additional notes"}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            {step !== "details" && (
              <Button variant="outline" onClick={prevStep}>
                Back
              </Button>
            )}
            {step === "review" ? (
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Referral
              </Button>
            ) : (
              <Button onClick={nextStep}>Next</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}