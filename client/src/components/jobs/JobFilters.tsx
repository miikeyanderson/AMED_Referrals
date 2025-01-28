import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface JobFilters {
  search: string;
  specialty: string;
  location: string;
  jobType: string;
}

const DEFAULT_FILTERS: JobFilters = {
  search: "",
  specialty: "all",
  location: "all-locations",
  jobType: "all-types",
};

export function JobFilters({ onFilterChange }: { onFilterChange: (filters: JobFilters) => void }) {
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);

  const handleFilterChange = (key: keyof JobFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search jobs..."
          className="pl-8"
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
        />
      </div>
      <Select value={filters.specialty} onValueChange={(value) => handleFilterChange("specialty", value)}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Specialty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Specialties</SelectItem>
          <SelectItem value="nursing">Nursing</SelectItem>
          <SelectItem value="physician">Physician</SelectItem>
          <SelectItem value="therapy">Therapy</SelectItem>
          <SelectItem value="tech">Tech/Lab</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.location} onValueChange={(value) => handleFilterChange("location", value)}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Location" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all-locations">All Locations</SelectItem>
          <SelectItem value="ca">California</SelectItem>
          <SelectItem value="ny">New York</SelectItem>
          <SelectItem value="tx">Texas</SelectItem>
          <SelectItem value="fl">Florida</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.jobType} onValueChange={(value) => handleFilterChange("jobType", value)}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Job Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all-types">All Types</SelectItem>
          <SelectItem value="full-time">Full Time</SelectItem>
          <SelectItem value="part-time">Part Time</SelectItem>
          <SelectItem value="contract">Contract</SelectItem>
          <SelectItem value="per-diem">Per Diem</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}