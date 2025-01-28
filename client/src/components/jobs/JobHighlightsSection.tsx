import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { JobCard } from "./JobCard";
import { JobFilters } from "./JobFilters";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function JobHighlightsSection() {
  const [filters, setFilters] = useState({
    specialty: "",
    location: "",
    minPay: 0
  });
  const [showFilters, setShowFilters] = useState(false); // Added state for popup

  const { data: jobs, error, isLoading } = useQuery({
    queryKey: ["/api/jobs", { ...filters, limit: 2 }],
    queryFn: async () => {
      const params = new URLSearchParams({
        specialty: filters.specialty,
        location: filters.location,
        minPay: filters.minPay.toString(),
        limit: "2"
      });
      const response = await fetch("/api/jobs?" + params);
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
      <div className="flex justify-between items-center"> {/*Added flex container */}
        <div> {/*Added div for Featured Job Opportunities*/}
          <h2 className="text-lg sm:text-xl">Featured Job Opportunities</h2>
        </div>
        <div className="md:hidden"> {/* Mobile filter button */}
          <button onClick={() => setShowFilters(!showFilters)} className="p-2 rounded-md bg-gray-200">
            {/* You might need to replace this with a proper hamburger icon */}
            ☰
          </button>
        </div>
      </div>
      {/* Filter popup */}
      {showFilters && (
        <div className="absolute top-16 right-0 bg-white shadow-md rounded-md z-10"> {/*Positioning and styling */}
          <JobFilters filters={filters} onFilterChange={setFilters} compact={true} />
        </div>
      )}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs?.jobs?.map((job: any) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={() => window.location.href = '/dashboard/clinician/jobs'}
          >
            All Jobs
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}