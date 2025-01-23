import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Loader2 } from "lucide-react";

interface PipelineData {
  total: number;
  statusBreakdown: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

interface ChartEntry {
  status: string;
  count: number;
  percentage: number;
}

const STATUS_COLORS = {
  pending: "hsl(var(--warning))",
  contacted: "hsl(var(--info))",
  interviewing: "hsl(var(--primary))",
  hired: "hsl(var(--success))",
  rejected: "hsl(var(--destructive))",
} as const;

const DEPARTMENTS = [
  { label: "All Departments", value: "all" },
  { label: "Engineering", value: "engineering" },
  { label: "Design", value: "design" },
  { label: "Product", value: "product" },
  { label: "Sales", value: "sales" },
];

const RECRUITERS = [
  { label: "All Recruiters", value: "all" },
  { label: "John Doe", value: "1" },
  { label: "Jane Smith", value: "2" },
];

export function PipelineSnapshotWidget() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedRecruiter, setSelectedRecruiter] = useState<string>("all");

  const { data: pipelineData, isLoading } = useQuery({
    queryKey: ["/api/recruiter/referrals/pipeline", { department: selectedDepartment, recruiter: selectedRecruiter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedDepartment !== "all") params.append("department", selectedDepartment);
      if (selectedRecruiter !== "all") params.append("recruiter", selectedRecruiter);

      const response = await fetch(`/api/recruiter/referrals/pipeline?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch pipeline data");
      }
      return response.json() as Promise<PipelineData>;
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Pipeline Snapshot</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept.value} value={dept.value}>
                  {dept.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedRecruiter} onValueChange={setSelectedRecruiter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by recruiter" />
            </SelectTrigger>
            <SelectContent>
              {RECRUITERS.map((recruiter) => (
                <SelectItem key={recruiter.value} value={recruiter.value}>
                  {recruiter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : pipelineData ? (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pipelineData.statusBreakdown}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  labelLine={false}
                  label={({ name, value }: { name: string; value: number }) =>
                    `${name} ${((value / pipelineData.total) * 100).toFixed(0)}%`
                  }
                >
                  {pipelineData.statusBreakdown.map((entry: ChartEntry, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[400px] items-center justify-center text-muted-foreground">
            No pipeline data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}