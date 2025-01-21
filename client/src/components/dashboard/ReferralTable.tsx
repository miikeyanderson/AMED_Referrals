
import { useQuery } from "@tanstack/react-query";
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
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

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
              <TableHead>Candidate</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Department</TableHead>
              {role !== "clinician" && <TableHead>Next Steps</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {referrals?.map((referral: any) => (
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
                  <Badge className={getStatusColor(referral.status)}>
                    {referral.status}
                  </Badge>
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
