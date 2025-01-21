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

interface ReferralTableProps {
  role: string;
}

export function ReferralTable({ role }: ReferralTableProps) {
  const referrals = [
    {
      id: 1,
      candidateName: "John Doe",
      position: "RN",
      status: "pending",
      date: "2024-01-20",
      reward: "$500",
    },
    // Add more sample data as needed
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Referrals</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              {role !== "clinician" && <TableHead>Reward</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {referrals.map((referral) => (
              <TableRow key={referral.id}>
                <TableCell className="font-medium">{referral.candidateName}</TableCell>
                <TableCell>{referral.position}</TableCell>
                <TableCell>
                  <Badge variant={referral.status === "pending" ? "secondary" : "success"}>
                    {referral.status}
                  </Badge>
                </TableCell>
                <TableCell>{referral.date}</TableCell>
                {role !== "clinician" && <TableCell>{referral.reward}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
