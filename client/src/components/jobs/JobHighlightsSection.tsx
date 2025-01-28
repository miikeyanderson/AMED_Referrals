import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { JobCard } from "./JobCard";
import { JobFilters } from "./JobFilters";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function JobHighlightsSection() {
  const [filters, setFilters] = useState({
    specialty: "",
    location: "",
    minPay: 0
  });

  const { data: jobs, error, isLoading } = useQuery({
    queryKey: ["/api/jobs", filters],
    queryFn: async () => {
      const response = await fetch("/api/jobs?" + new URLSearchParams({
        specialty: filters.specialty,
        location: filters.location,
        minPay: filters.minPay.toString()
      }));
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }
      return response.json();
    }
  });

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load job opportunities. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return <div>Loading jobs...</div>;
  }

  return (
    <div className="space-y-4">
      <JobFilters filters={filters} onFilterChange={setFilters} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs?.jobs?.map((job: any) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}