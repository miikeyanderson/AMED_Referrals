import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardLayout from "@/components/layout/dashboard-layout";
import ClinicianDashboard from "@/pages/dashboard/clinician";
import RecruiterDashboard from "@/pages/dashboard/recruiter";
import LeadershipDashboard from "@/pages/dashboard/leadership";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { ThemeProvider } from "@/components/themes/theme-provider";
import { ThemeToggle } from "@/components/themes/theme-toggle";

function ProtectedRoute({ 
  component: Component, 
  allowedRoles = [] 
}: { 
  component: React.ComponentType;
  allowedRoles?: string[];
}) {
  const { user, isLoading } = useUser();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    setLocation("/auth");
    return null;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}

function Router() {
  const { user, isLoading } = useUser();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <Switch>
      <Route path="/" component={() => {
        const dashboardPath = `/dashboard/${user.role}`;
        setLocation(dashboardPath);
        return null;
      }} />
      <Route path="/dashboard" component={() => {
        const dashboardPath = `/dashboard/${user.role}`;
        setLocation(dashboardPath);
        return null;
      }} />

      <Route path="/dashboard/clinician" component={() => 
        <ProtectedRoute component={ClinicianDashboard} allowedRoles={['clinician']} />
      } />
      <Route path="/dashboard/recruiter" component={() => 
        <ProtectedRoute component={RecruiterDashboard} allowedRoles={['recruiter']} />
      } />
      <Route path="/dashboard/leadership" component={() => 
        <ProtectedRoute component={LeadershipDashboard} allowedRoles={['leadership']} />
      } />

      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <QueryClientProvider client={queryClient}>
        <div className="relative">
          <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
          </div>
          <Router />
          <Toaster />
        </div>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;