
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function ReferralForm() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    candidateName: "",
    candidateEmail: "",
    position: "",
    department: "",
    experience: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'candidateName':
        return value.length < 2 ? 'Name must be at least 2 characters' : '';
      case 'candidateEmail':
        return !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) ? 'Invalid email format' : '';
      case 'position':
        return value.length < 2 ? 'Position is required' : '';
      case 'department':
        return !value ? 'Department is required' : '';
      case 'experience':
        return value.length > 1000 ? 'Experience cannot exceed 1000 characters' : '';
      case 'notes':
        return value.length > 2000 ? 'Notes cannot exceed 2000 characters' : '';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { mutate } = useMutation({
    mutationFn: async (data: typeof formData) => {
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
      setOpen(false);
      setFormData({
        candidateName: "",
        candidateEmail: "",
        position: "",
        department: "",
        experience: "",
        notes: "",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add New Referral</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Referral</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              name="candidateName"
              placeholder="Candidate Name"
              value={formData.candidateName}
              onChange={handleChange}
              className={errors.candidateName ? "border-red-500" : ""}
            />
            {errors.candidateName && (
              <p className="text-sm text-red-500">{errors.candidateName}</p>
            )}
          </div>
          <div className="space-y-2">
            <Input
              name="candidateEmail"
              placeholder="Candidate Email"
              type="email"
              value={formData.candidateEmail}
              onChange={handleChange}
              className={errors.candidateEmail ? "border-red-500" : ""}
            />
            {errors.candidateEmail && (
              <p className="text-sm text-red-500">{errors.candidateEmail}</p>
            )}
          </div>
          <div className="space-y-2">
            <Input
              name="position"
              placeholder="Position"
              value={formData.position}
              onChange={handleChange}
              className={errors.position ? "border-red-500" : ""}
            />
            {errors.position && (
              <p className="text-sm text-red-500">{errors.position}</p>
            )}
          </div>
          <div className="space-y-2">
            <Select
              value={formData.department}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, department: value }));
                const error = validateField('department', value);
                setErrors(prev => ({ ...prev, department: error }));
              }}
            >
            <SelectTrigger>
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Design">Design</SelectItem>
              <SelectItem value="Product">Product</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Sales">Sales</SelectItem>
            </SelectContent>
          </Select>
          <div className="space-y-2">
            <Input
              name="experience"
              placeholder="Experience"
              value={formData.experience}
              onChange={handleChange}
              className={errors.experience ? "border-red-500" : ""}
            />
            {errors.experience && (
              <p className="text-sm text-red-500">{errors.experience}</p>
            )}
          </div>
          <div className="space-y-2">
            <Input
              name="notes"
              placeholder="Notes"
              value={formData.notes}
              onChange={handleChange}
              className={errors.notes ? "border-red-500" : ""}
            />
            {errors.notes && (
              <p className="text-sm text-red-500">{errors.notes}</p>
            )}
          </div>
          <Button 
            onClick={() => validateForm() && mutate(formData)} 
            className="w-full"
          >
            Submit Referral
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
