import { z } from "zod";

export const clinicianProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  specialty: z.string().min(1, "Specialty is required"),
  certifications: z.array(z.string()).min(1, "At least one certification is required"),
  resume: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, "File size must be less than 5MB")
    .refine(
      (file) => 
        ["application/pdf", "image/jpeg", "image/png"].includes(file.type),
      "File must be PDF, JPEG, or PNG"
    )
});

export type ClinicianProfileFormData = z.infer<typeof clinicianProfileSchema>;
