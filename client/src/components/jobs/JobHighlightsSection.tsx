import { useState, useRef, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Job } from "@db/schema";
import { JobCard } from "./JobCard";
import { JobFilters, type JobFilters as JobFiltersType } from "./JobFilters";
import { Loader2 } from "lucide-react";

const PAGE_SIZE = 10;

export function JobHighlightsSection() {
  const [filters, setFilters] = useState<JobFiltersType>({
    search: "",
    specialty: "",
    location: "",
    minPay: 0,
    maxPay: 200000,
  });

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["jobs", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const searchParams = new URLSearchParams({
        page: pageParam.toString(),
        limit: PAGE_SIZE.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.specialty && { specialty: filters.specialty }),
        ...(filters.location && { location: filters.location }),
        minPay: filters.minPay.toString(),
        maxPay: filters.maxPay.toString(),
      });

      const response = await fetch(`/api/jobs?${searchParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.pagination.totalItems / PAGE_SIZE);
      const nextPage = lastPage.pagination.currentPage + 1;
      return nextPage <= totalPages ? nextPage : undefined;
    },
    initialPageParam: 1,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleFilterChange = (newFilters: JobFiltersType) => {
    setFilters(newFilters);
  };

  if (status === "error") {
    return (
      <div className="text-center py-8 text-destructive">
        Error loading jobs. Please try again later.
      </div>
    );
  }

  const jobs = data?.pages.flatMap((page) => page.jobs) ?? [];

  return (
    <div className="space-y-6">
      <JobFilters onFilterChange={handleFilterChange} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((job: Job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {status === "pending" && !isFetchingNextPage && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={loadMoreRef} className="h-4" />

      {!hasNextPage && jobs.length > 0 && (
        <div className="text-center py-4 text-muted-foreground">
          No more jobs to load
        </div>
      )}

      {jobs.length === 0 && status !== "pending" && (
        <div className="text-center py-8 text-muted-foreground">
          No jobs found matching your criteria
        </div>
      )}
    </div>
  );
}