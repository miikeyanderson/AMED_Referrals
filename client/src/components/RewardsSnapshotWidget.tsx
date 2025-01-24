import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, DollarSign, Clock, CheckCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

import { RewardsSnapshot } from "@/types/api";

export function RewardsSnapshotWidget() {
  const { data, error, isLoading } = useQuery<RewardsSnapshot>({
    queryKey: ['/api/clinician/rewards-snapshot'],
    queryFn: async () => {
      const response = await fetch('/api/clinician/rewards-snapshot', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch rewards data');
      }
      const rawData = await response.json();
      
      // Validate data structure
      if (!rawData || typeof rawData !== 'object') {
        throw new Error('Invalid response format');
      }

      // Ensure all required fields exist with correct types
      const validated = {
        pending: {
          count: Number(rawData.pending?.count || 0),
          amount: Number(rawData.pending?.amount || 0)
        },
        paid: {
          count: Number(rawData.paid?.count || 0),
          amount: Number(rawData.paid?.amount || 0)
        },
        totalEarned: Number(rawData.totalEarned || 0),
        recentPayments: (Array.isArray(rawData.recentPayments) ? rawData.recentPayments : [])
          .map(payment => ({
            id: Number(payment.id),
            amount: Number(payment.amount),
            status: payment.status === 'paid' ? 'paid' : 'pending',
            createdAt: new Date(payment.createdAt).toISOString()
          }))
      };

      return validated;
    }
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load rewards data. Please try again later.</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Rewards Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="metrics" className="space-y-4">
          <TabsList>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="history">Payment History</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-4">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium leading-none">Total Earned</p>
                        <p className="text-2xl font-bold">${data.totalEarned}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-4">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="text-sm font-medium leading-none">Pending</p>
                        <p className="text-2xl font-bold">${data.pending.amount}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.pending.count} referrals
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-4">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium leading-none">Paid</p>
                        <p className="text-2xl font-bold">${data.paid.amount}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.paid.count} referrals
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Milestone Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Quarterly Goal</p>
                      <p className="text-sm text-muted-foreground">
                        ${data.totalEarned} / $5,000
                      </p>
                    </div>
                    <Progress value={(data.totalEarned / 5000) * 100} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Successful Referrals</p>
                      <p className="text-sm text-muted-foreground">
                        {data.paid.count} / 10
                      </p>
                    </div>
                    <Progress value={(data.paid.count / 10) * 100} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {format(new Date(payment.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>${payment.amount}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              payment.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {payment.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}