import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
  isLoading?: boolean;
}

export interface FilterState {
  role: string;
  department: string;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  sortBy: string;
  sortDirection: "asc" | "desc";
}

const ROLES = [
  { label: "All Roles", value: "all" },
  { label: "Software Engineer", value: "software_engineer" },
  { label: "Product Manager", value: "product_manager" },
  { label: "Designer", value: "designer" },
  { label: "Data Scientist", value: "data_scientist" },
];

const DEPARTMENTS = [
  { label: "All Departments", value: "all" },
  { label: "Engineering", value: "engineering" },
  { label: "Product", value: "product" },
  { label: "Design", value: "design" },
  { label: "Data", value: "data" },
];

const SORT_OPTIONS = [
  { label: "Last Activity", value: "lastActivity" },
  { label: "Name", value: "name" },
  { label: "Role", value: "role" },
];

export function FilterBar({ onFilterChange, isLoading = false }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    role: "all",
    department: "all",
    dateRange: {
      from: undefined,
      to: undefined,
    },
    sortBy: "lastActivity",
    sortDirection: "desc",
  });

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const resetFilters = () => {
    const defaultFilters: FilterState = {
      role: "all",
      department: "all",
      dateRange: {
        from: undefined,
        to: undefined,
      },
      sortBy: "lastActivity",
      sortDirection: "desc",
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  return (
    <div className="p-4 bg-card border rounded-lg space-y-4">
      <div className="flex flex-col md:flex-row flex-wrap gap-4 md:gap-8"> {/* Added flex-col and md:flex-row */}
        <Select
          value={filters.role}
          onValueChange={(value) => handleFilterChange({ role: value })}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full md:w-[200px]"> {/* Modified */}
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.department}
          onValueChange={(value) => handleFilterChange({ department: value })}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full md:w-[200px]"> {/* Modified */}
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENTS.map((dept) => (
              <SelectItem key={dept.value} value={dept.value}>
                {dept.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full md:w-[240px] justify-start text-left font-normal",
                !filters.dateRange.from && "text-muted-foreground"
              )}
              disabled={isLoading}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateRange.from ? (
                filters.dateRange.to ? (
                  <>
                    {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                    {format(filters.dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(filters.dateRange.from, "LLL dd, y")
                )
              ) : (
                "Select date range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={filters.dateRange.from}
              selected={{
                from: filters.dateRange.from,
                to: filters.dateRange.to,
              }}
              onSelect={(range) =>
                handleFilterChange({
                  dateRange: {
                    from: range?.from,
                    to: range?.to,
                  },
                })
              }
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <Select
          value={filters.sortBy}
          onValueChange={(value) => handleFilterChange({ sortBy: value })}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full md:w-[200px]"> {/* Modified */}
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            handleFilterChange({
              sortDirection: filters.sortDirection === "asc" ? "desc" : "asc",
            })
          }
          disabled={isLoading}
        >
          {filters.sortDirection === "asc" ? "↑" : "↓"}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={resetFilters}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}