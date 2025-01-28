import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, X } from "lucide-react";
import { specialtyEnum } from "@db/schema";

interface JobFiltersProps {
  onFilterChange: (filters: JobFilters) => void;
}

export interface JobFilters {
  search: string;
  specialty: string;
  location: string;
  minPay: number;
  maxPay: number;
}

const DEFAULT_FILTERS: JobFilters = {
  search: "",
  specialty: "",
  location: "",
  minPay: 0,
  maxPay: 200000,
};

export function JobFilters({ onFilterChange }: JobFiltersProps) {
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);
  const [payRange, setPayRange] = useState([DEFAULT_FILTERS.minPay, DEFAULT_FILTERS.maxPay]);

  const handleFilterChange = (
    key: keyof JobFilters,
    value: string | number | number[]
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePayRangeChange = (value: number[]) => {
    setPayRange(value);
    handleFilterChange("minPay", value[0]);
    handleFilterChange("maxPay", value[1]);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPayRange([DEFAULT_FILTERS.minPay, DEFAULT_FILTERS.maxPay]);
    onFilterChange(DEFAULT_FILTERS);
  };

  return (
    <div className="space-y-4 bg-card p-4 rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={filters.specialty}
            onValueChange={(value) => handleFilterChange("specialty", value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Specialty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Specialties</SelectItem>
              {(specialtyEnum.enumValues as string[]).map((specialty) => (
                <SelectItem key={specialty} value={specialty}>
                  {specialty.charAt(0).toUpperCase() + specialty.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={resetFilters}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Salary Range</label>
        <Slider
          min={0}
          max={200000}
          step={10000}
          value={payRange}
          onValueChange={handlePayRangeChange}
          className="my-4"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>${payRange[0].toLocaleString()}</span>
          <span>${payRange[1].toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
