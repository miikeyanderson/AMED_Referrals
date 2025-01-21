import { useUser } from "@/hooks/use-user";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  UserPlus, 
  BarChart3, 
  ClipboardList, 
  LogOut,
  Settings
} from "lucide-react";

const roleRoutes = {
  clinician: [
    { href: "/dashboard/clinician", label: "My Referrals", icon: ClipboardList },
    { href: "/dashboard/clinician/submit", label: "Submit Referral", icon: UserPlus },
  ],
  recruiter: [
    { href: "/dashboard/recruiter", label: "Referral Pipeline", icon: Users },
    { href: "/dashboard/recruiter/metrics", label: "Hiring Metrics", icon: BarChart3 },
  ],
  leadership: [
    { href: "/dashboard/leadership", label: "Team Performance", icon: BarChart3 },
    { href: "/dashboard/leadership/reports", label: "Reports", icon: ClipboardList },
  ],
};

const commonRoutes = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useUser();
  const [location] = useLocation();

  if (!user) {
    return null;
  }

  const userRoutes = roleRoutes[user.role as keyof typeof roleRoutes] || [];
  const routes = [...userRoutes, ...commonRoutes];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar border-r border-sidebar-border">
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
          <h1 className="text-xl font-semibold text-sidebar-foreground">ARM Platform</h1>
        </div>
        <div className="p-4 space-y-2">
          {routes.map((route) => {
            const Icon = route.icon;
            return (
              <Link key={route.href} href={route.href}>
                <Button
                  variant={location === route.href ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {route.label}
                </Button>
              </Link>
            );
          })}
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        <div className="h-16 border-b flex items-center px-6">
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user.name}
            </span>
          </div>
        </div>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
