import { useCallback, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
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
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

// Define proper types
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

const STATUS_COLORS: Record<ReferralStatus, string> = {
  pending: "secondary",
  contacted: "primary",
  interviewing: "warning",
  hired: "success",
  rejected: "destructive",
} as const;

const STATUS_OPTIONS: Array<{ label: string; value: ReferralStatus | "all" }> = [
  { label: "All statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Contacted", value: "contacted" },
  { label: "Interviewing", value: "interviewing" },
  { label: "Hired", value: "hired" },
  { label: "Rejected", value: "rejected" },
];

export function ReferralTable({ role }: ReferralTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReferralStatus | "all">("all");
  const [debouncedSearch] = useDebounce(search, 500);

  const fetchReferrals = useCallback(async ({ queryKey }: { queryKey: [string, { search: string; status: string }] }) => {
    const [_, { search, status }] = queryKey;
    const searchParams = new URLSearchParams();

    if (search) searchParams.append("search", search);
    if (status !== "all") searchParams.append("status", status);

    try {
      const response = await fetch(`/api/referrals?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data as Referral[];
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to fetch referrals");
    }
  }, []);

  const { data: referrals = [], isLoading, error } = useQuery({
    queryKey: ["/api/referrals", { search: debouncedSearch, status }],
    queryFn: fetchReferrals,
    staleTime: 1000 * 60, // Consider data fresh for 1 minute
    retry: 3,
  });

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  );

  const tableContent = useMemo(() => {
    if (isLoading) {
      return <LoadingSkeleton />;
    }

    if (error) {
      return (
        <TableRow>
          <TableCell 
            colSpan={role === "clinician" ? 4 : 5} 
            className="text-center py-8 text-red-500"
          >
            Error loading referrals. Please try again later.
          </TableCell>
        </TableRow>
      );
    }

    if (referrals.length === 0) {
      return (
        <TableRow>
          <TableCell 
            colSpan={role === "clinician" ? 4 : 5} 
            className="text-center py-8"
          >
            No referrals found
          </TableCell>
        </TableRow>
      );
    }

    return referrals.map((referral) => (
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
    ));
  }, [referrals, isLoading, error, role]);

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
          <Select value={status} onValueChange={setStatus}>
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
            {tableContent}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}