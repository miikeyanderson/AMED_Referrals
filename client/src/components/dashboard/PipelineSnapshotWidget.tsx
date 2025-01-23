
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
import { cn } from "@/lib/utils";

const STATUS_COLORS = {
  pending: "hsl(221.2 83.2% 53.3%)",     // Bright blue
  contacted: "hsl(45 93% 47%)",          // Bright yellow
  interviewing: "hsl(262.1 83.3% 57.8%)", // Bright purple
  hired: "hsl(142.1 76.2% 46.3%)",       // Bright green
  rejected: "hsl(346.8 77.2% 49.8%)",    // Bright red
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
      return response.json();
    },
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card p-3 rounded-lg border shadow-lg">
          <p className="font-medium text-sm text-foreground">{data.status}</p>
          <p className="text-xs text-muted-foreground">Count: {data.count}</p>
          <p className="text-xs text-muted-foreground">
            {data.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Pipeline Snapshot</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[180px] bg-background border-border/50">
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
            <SelectTrigger className="w-[180px] bg-background border-border/50">
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
                  label={({ name, value, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pipelineData.statusBreakdown.map((entry: any) => (
                    <Cell 
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS]} 
                      className="opacity-80 hover:opacity-100 transition-opacity"
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value: string) => (
                    <span className="text-sm text-muted-foreground">
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </span>
                  )}
                />
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
