
import { JobFilters } from "@/components/jobs/JobFilters";
import { JobCard } from "@/components/jobs/JobCard";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function JobSearchPage() {
  const [filters, setFilters] = useState({
    specialty: "",
    location: "",
    minPay: 0,
    maxPay: 0,
    page: 1,
    limit: 10
  });

  const { data, isLoading } = useQuery({
    queryKey: ['/api/jobs', filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        specialty: filters.specialty,
        location: filters.location,
        minPay: filters.minPay.toString(),
        maxPay: filters.maxPay.toString(),
        page: filters.page.toString(),
        limit: filters.limit.toString()
      });
      const response = await fetch(`/api/jobs?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      return response.json();
    }
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <h1 className="text-2xl font-bold mb-6">Search Jobs</h1>
      <JobFilters filters={filters} onFilterChange={setFilters} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {isLoading ? (
          <div>Loading jobs...</div>
        ) : (
          data?.jobs?.map((job: any) => (
            <JobCard key={job.id} job={job} />
          ))
        )}
      </div>
    </div>
  );
}
