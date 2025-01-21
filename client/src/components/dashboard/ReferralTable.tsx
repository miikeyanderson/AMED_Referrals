import * as React from "react";
import { useState } from "react";
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

interface ReferralTableProps {
  role: string;
}

export function ReferralTable({ role }: ReferralTableProps) {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['/api/referrals', { search, status }],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (search) searchParams.append('search', search);
      if (status !== 'all') searchParams.append('status', status);

      const response = await fetch(`/api/referrals?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch referrals');
      }
      return response.json();
    },
  });

  const statusColors: Record<string, string> = {
    pending: "secondary",
    contacted: "primary",
    interviewing: "warning",
    hired: "success",
    rejected: "destructive",
  };

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
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="interviewing">Interviewing</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">Loading referrals...</div>
        ) : (
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
              {referrals.map((referral: any) => (
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
                    <Badge variant={statusColors[referral.status] || "secondary"}>
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
              ))}
              {referrals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={role === "clinician" ? 4 : 5} className="text-center py-8">
                    No referrals found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}