
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "wouter";
import { useState } from "react";

export default function JobApplyPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    notes: "",
    resume: null as File | null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation for job application submission
    toast({
      title: "Application Submitted",
      description: "Your application has been submitted successfully."
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Apply for Position</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2">Additional Notes</label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Add any additional information about your application"
          />
        </div>
        <div>
          <label className="block mb-2">Resume</label>
          <Input
            type="file"
            onChange={(e) => setFormData({ ...formData, resume: e.target.files?.[0] || null })}
            accept=".pdf,.doc,.docx"
          />
        </div>
        <Button type="submit">Submit Application</Button>
      </form>
    </div>
  );
}
