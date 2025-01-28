import { JobHighlightsSection } from "@/components/jobs/JobHighlightsSection";

export default function ClinicianJobsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <h1 className="text-2xl font-bold mb-6">Job Opportunities</h1>
      <JobHighlightsSection />
    </div>
  );
}
