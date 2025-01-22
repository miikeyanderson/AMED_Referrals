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
  status: string;
  count: number;
  candidates: Array<{
    id: number;
    candidateName: string;
    position: string;
    department: string;
    recruiter: string;
  }>;
}

const STATUS_COLORS = {
  pending: "hsl(var(--warning))",
  contacted: "hsl(var(--info))",
  interviewing: "hsl(var(--primary))",
  hired: "hsl(var(--success))",
  rejected: "hsl(var(--destructive))",
};

export function PipelineSnapshotWidget() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedRecruiter, setSelectedRecruiter] = useState<string>("");

  const { data: pipelineData, isLoading } = useQuery({
    queryKey: ["/api/recruiter/referrals/pipeline", { department: selectedDepartment, recruiter: selectedRecruiter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedDepartment) params.append("department", selectedDepartment);
      if (selectedRecruiter) params.append("recruiter", selectedRecruiter);

      const response = await fetch(`/api/recruiter/referrals/pipeline?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch pipeline data");
      }
      return response.json();
    },
  });

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Pipeline Snapshot</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Departments</SelectItem>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Design">Design</SelectItem>
              <SelectItem value="Product">Product</SelectItem>
              <SelectItem value="Sales">Sales</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedRecruiter} onValueChange={setSelectedRecruiter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Recruiters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Recruiters</SelectItem>
              <SelectItem value="1">John Doe</SelectItem>
              <SelectItem value="2">Jane Smith</SelectItem>
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
                  data={pipelineData}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pipelineData.map((entry: PipelineData, index: number) => (
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
