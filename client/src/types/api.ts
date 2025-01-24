export interface PendingReferralsResponse {
  count: number;
}

export interface NotificationsResponse {
  count: number;
}

export interface User {
  id: number;
  username: string;
  password: string;
  role: "recruiter" | "clinician" | "leadership";
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
}
export interface RewardsSnapshot {
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
}

export type RewardsStatus = 'pending' | 'paid';
