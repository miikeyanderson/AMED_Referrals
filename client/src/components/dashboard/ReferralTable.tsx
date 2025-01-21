import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "react-use";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/use-user";

type ReferralStatus = "pending" | "contacted" | "interviewing" | "hired" | "rejected";

interface Referral {
  id: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  status: ReferralStatus;
  createdAt: string;
  nextSteps?: string;
}

interface ReferralTableProps {
  role: "clinician" | "admin" | "recruiter";
}

const STATUS_COLORS: Record<ReferralStatus, "default" | "primary" | "secondary" | "destructive"> = {
  pending: "secondary",
  contacted: "primary",
  interviewing: "default",
  hired: "primary",
  rejected: "destructive",
};

const STATUS_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Contacted", value: "contacted" },
  { label: "Interviewing", value: "interviewing" },
  { label: "Hired", value: "hired" },
  { label: "Rejected", value: "rejected" },
];

function LoadingSkeleton({ role }: { role: string }) {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-3 w-[180px]" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
          <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
          <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
          {role !== "clinician" && (
            <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
          )}
        </TableRow>
      ))}
    </>
  );
}

export function ReferralTable({ role }: ReferralTableProps) {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<ReferralStatus | "all">("all");
  const [debouncedSearch] = useDebounce(search, 500);
  const { user } = useUser();

  const { data: referrals = [], isLoading, error } = useQuery({
    queryKey: ["/api/referrals", { search: debouncedSearch, status }],
    queryFn: async ({ queryKey }) => {
      const [_, { search, status }] = queryKey as [string, { search: string; status: string }];
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (status !== "all") params.append("status", status);
      
      const response = await fetch(`/api/referrals?${params}`);
      if (!response.ok) throw new Error("Failed to fetch referrals");
      return response.json();
    },
    enabled: !!user,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Referrals</CardTitle>
        <div className="flex gap-4 mt-4">
          <Input
            placeholder="Search referrals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select 
            value={status} 
            onValueChange={(value: ReferralStatus | "all") => setStatus(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              {role !== "clinician" && <TableHead>Next Steps</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <LoadingSkeleton role={role} />
            ) : error ? (
              <TableRow>
                <TableCell 
                  colSpan={role === "clinician" ? 4 : 5} 
                  className="text-center py-8 text-red-500"
                >
                  Error loading referrals
                </TableCell>
              </TableRow>
            ) : referrals.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={role === "clinician" ? 4 : 5} 
                  className="text-center py-8"
                >
                  No referrals found
                </TableCell>
              </TableRow>
            ) : (
              referrals.map((referral: Referral) => (
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
                    <Badge variant={STATUS_COLORS[referral.status]}>
                      {referral.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(referral.createdAt).toLocaleDateString()}
                  </TableCell>
                  {role !== "clinician" && (
                    <TableCell>
                      {referral.nextSteps || "No next steps"}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
