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
      <div className="relative">
        <div className="overflow-x-auto pb-4">
          <div className="flex space-x-4 w-max">
            {jobs?.jobs?.map((job: any) => (
              <div key={job.id} className="w-[300px] sm:w-[350px]">
                <JobCard job={job} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}