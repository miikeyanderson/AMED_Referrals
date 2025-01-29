
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { JobHighlightsSection } from "@/components/jobs/JobHighlightsSection";

export default function JobsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Job Opportunities</h1>
        <Link href="/dashboard/clinician/jobs/search">
          <Button>Search All Jobs</Button>
        </Link>
      </div>
      <JobHighlightsSection />
    </div>
  );
}
