import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { ProfileForm } from "@/components/referred-clinician/ProfileForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

interface ReferralDetails {
  id: number;
  candidateEmail: string;
  candidateName: string;
  position: string;
  status: string;
}

export default function ReferredClinicianProfile() {
  const [isMatch, params] = useRoute("/referred-clinician/:token");
  const [, setLocation] = useLocation();
  const token = params?.token;

  // Redirect if no token is present
  useEffect(() => {
    if (!isMatch || !token) {
      setLocation("/");
    }
  }, [isMatch, token, setLocation]);

  const { data: referralDetails, isLoading, error } = useQuery<ReferralDetails>({
    queryKey: [`/api/referrals/${token}`],
    queryFn: async () => {
      const response = await fetch(`/api/referrals/${token}`);
      if (!response.ok) {
        throw new Error("Invalid or expired referral link");
      }
      return response.json();
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center min-h-[200px] gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="text-muted-foreground">Loading referral details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load referral details"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            referralToken={token}
            defaultEmail={referralDetails?.candidateEmail}
          />
        </CardContent>
      </Card>
    </div>
  );
}