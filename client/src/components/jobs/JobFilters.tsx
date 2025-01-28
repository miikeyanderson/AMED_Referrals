
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  const handleFilterChange = (key: keyof JobFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const FilterContent = () => (
    <div className="flex flex-col md:flex-row gap-2">
      <Select value={filters.specialty} onValueChange={(value) => handleFilterChange("specialty", value)}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Specialty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Specialties</SelectItem>
          <SelectItem value="nursing">Nursing</SelectItem>
          <SelectItem value="physician">Physician</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.location} onValueChange={(value) => handleFilterChange("location", value)}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Location" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all-locations">All Locations</SelectItem>
          <SelectItem value="ca">California</SelectItem>
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

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return <FilterContent />;
}
