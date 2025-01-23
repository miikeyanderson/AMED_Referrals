import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  DollarSign,
  Clock,
  CheckCircle,
  Award,
  Trophy,
  Star,
  Zap,
  Target,
  Users
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import React from 'react';

interface Achievement {
  id: number;
  name: string;
  description: string;
  type: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  progress: number;
  requiredScore: number;
  isCompleted: boolean;
  iconUrl?: string;
}

interface RewardsSnapshot {
  pending: {
    count: number;
    amount: number;
  };
  paid: {
    count: number;
    amount: number;
  };
  totalEarned: number;
  recentPayments: Array<{
    id: number;
    amount: number;
    status: 'pending' | 'paid';
    createdAt: string;
  }>;
  achievements: Achievement[];
}

const tierColors = {
  bronze: 'bg-orange-500',
  silver: 'bg-gray-400',
  gold: 'bg-yellow-400',
  platinum: 'bg-blue-400',
  diamond: 'bg-purple-500'
};

const achievementIcons = {
  referral_streak: Trophy,
  monthly_target: Target,
  career_milestone: Star,
  quality_rating: Award,
  speed_hero: Zap,
  team_player: Users
};

export function RewardsSnapshotWidget() {
  const { data, error, isLoading } = useQuery<RewardsSnapshot>({
    queryKey: ['/api/clinician/rewards-snapshot'],
    queryFn: async () => {
      const response = await fetch('/api/clinician/rewards-snapshot');
      if (!response.ok) {
        throw new Error(`Failed to fetch rewards: ${response.statusText}`);
      }
      return response.json();
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
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load rewards data'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Rewards & Achievements</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="metrics" className="space-y-4">
          <TabsList>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="history">Payment History</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-4">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium leading-none">Total Earned</p>
                        <p className="text-2xl font-bold">${data.totalEarned.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
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

          <TabsContent value="achievements">
            <div className="grid gap-4 md:grid-cols-2">
              {data.achievements?.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`relative overflow-hidden ${achievement.isCompleted ? 'border-green-500' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          {achievement.iconUrl ? (
                            <img
                              src={achievement.iconUrl}
                              alt=""
                              className="w-12 h-12"
                            />
                          ) : (
                            <div className={`p-2 rounded-full ${tierColors[achievement.tier]}`}>
                              {achievementIcons[achievement.type] &&
                                React.createElement(achievementIcons[achievement.type], {
                                  className: "w-8 h-8 text-white"
                                })
                              }
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold">{achievement.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {achievement.description}
                            </p>
                          </div>
                        </div>
                        <Badge variant={achievement.isCompleted ? "success" : "secondary"}>
                          {achievement.tier}
                        </Badge>
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{achievement.progress}/{achievement.requiredScore}</span>
                        </div>
                        <Progress
                          value={(achievement.progress / achievement.requiredScore) * 100}
                          className={`h-2 ${
                            achievement.isCompleted ? 'bg-green-200' : ''
                          }`}
                        />
                      </div>

                      {achievement.isCompleted && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2"
                        >
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
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