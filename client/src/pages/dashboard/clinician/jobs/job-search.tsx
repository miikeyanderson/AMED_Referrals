
import { JobFilters } from "@/components/jobs/JobFilters"
import { JobListItem } from "@/components/jobs/JobListItem"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function JobSearchPage() {
  const [filters, setFilters] = useState({
    specialty: "",
    location: "",
    minPay: 0,
    maxPay: 0,
    sortBy: "recent",
    page: 1,
    limit: 10
  })

  const { data, isLoading } = useQuery({
    queryKey: ['/api/jobs/search', filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        specialty: filters.specialty,
        location: filters.location,
        minPay: filters.minPay.toString(),
        maxPay: filters.maxPay.toString(),
        sortBy: filters.sortBy,
        page: filters.page.toString(),
        limit: filters.limit.toString()
      })
      const response = await fetch(`/api/jobs/search?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch jobs')
      }
      return response.json()
    }
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Search Jobs</h1>
        <div className="flex items-center gap-4">
          <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="salary-high">Highest Salary</SelectItem>
              <SelectItem value="salary-low">Lowest Salary</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">Save Search</Button>
        </div>
      </div>

      <JobFilters filters={filters} onFilterChange={setFilters} />
      
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div>Loading jobs...</div>
        ) : (
          data?.jobs?.map((job: any) => (
            <JobListItem
              key={job.id}
              salary={job.salary}
              title={job.title}
              schedule={job.schedule}
              location={job.location}
              isAboveAverage={job.isAboveAverage}
              postedTime={job.postedTime}
            />
          ))
        )}
      </div>
      
      {data?.totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Button 
            variant="outline"
            disabled={filters.page === 1}
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            Previous
          </Button>
          <span className="mx-4">
            Page {filters.page} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={filters.page === data.totalPages}
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
