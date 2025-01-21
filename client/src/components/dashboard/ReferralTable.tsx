import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface ReferralTableProps {
  role: string;
}

export function ReferralTable({ role }: ReferralTableProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const { data: referrals } = useQuery({
    queryKey: ["/api/referrals", { search, status }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (status !== "all") params.append("status", status);

      const response = await fetch(`/api/referrals?${params.toString()}`);
      if (!response.ok) return [];
      return response.json();
    },
  });

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      contacted: "bg-blue-100 text-blue-800",
      interviewing: "bg-purple-100 text-purple-800",
      hired: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Search referrals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="interviewing">Interviewing</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => {
                setSortField("candidateName");
                setSortDirection(current => current === "asc" ? "desc" : "asc");
              }} className="cursor-pointer hover:bg-secondary">
                Candidate {sortField === "candidateName" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => {
                setSortField("position");
                setSortDirection(current => current === "asc" ? "desc" : "asc");
              }} className="cursor-pointer hover:bg-secondary">
                Position {sortField === "position" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => {
                setSortField("status");
                setSortDirection(current => current === "asc" ? "desc" : "asc");
              }} className="cursor-pointer hover:bg-secondary">
                Status {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => {
                setSortField("department");
                setSortDirection(current => current === "asc" ? "desc" : "asc");
              }} className="cursor-pointer hover:bg-secondary">
                Department {sortField === "department" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              {role !== "clinician" && (
                <TableHead onClick={() => {
                  setSortField("nextSteps");
                  setSortDirection(current => current === "asc" ? "desc" : "asc");
                }} className="cursor-pointer hover:bg-secondary">
                  Next Steps {sortField === "nextSteps" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {referrals?.sort((a: any, b: any) => {
              const modifier = sortDirection === "asc" ? 1 : -1;
              return a[sortField] > b[sortField] ? modifier : -modifier;
            }).map((referral: any) => (
              <TableRow key={referral.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{referral.candidateName}</div>
                    <div className="text-sm text-muted-foreground">
                      {referral.candidateEmail}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{referral.position}</TableCell>
                <TableCell>
                  {role === "clinician" ? (
                    <Badge className={getStatusColor(referral.status)}>
                      {referral.status}
                    </Badge>
                  ) : (
                    <Select
                      value={referral.status}
                      onValueChange={async (value) => {
                        const response = await fetch(`/api/referrals/${referral.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: value }),
                        });
                        if (response.ok) {
                          queryClient.invalidateQueries({ queryKey: ["/api/referrals"] });
                        }
                      }}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="interviewing">Interviewing</SelectItem>
                        <SelectItem value="hired">Hired</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell>{referral.department}</TableCell>
                {role !== "clinician" && (
                  <TableCell>{referral.nextSteps || "No next steps"}</TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}