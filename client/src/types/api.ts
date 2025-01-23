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
