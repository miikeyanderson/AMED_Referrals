import { Settings, Users, ChartBar, ClipboardList } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const roleRoutes = {
  clinician: [
    { href: "/dashboard/clinician", label: "Referrals", icon: ClipboardList },
  ],
  recruiter: [
    { href: "/dashboard/recruiter", label: "Pipeline", icon: Users },
  ],
  leadership: [
    { href: "/dashboard/leadership", label: "Analytics", icon: ChartBar },
  ],
};

const commonRoutes = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useUser();
  const [location] = useLocation();
  const isMobile = useIsMobile();

  if (!user) {
    return null;
  }

  const userRoutes = roleRoutes[user.role as keyof typeof roleRoutes] || [];
  const routes = [...userRoutes, ...commonRoutes];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main content */}
      <div className={cn(
        "flex-1 transition-all duration-300",
        // Mobile: full width, no left padding, bottom padding for sidebar
        isMobile ? "w-full px-4 pb-20" : "pl-[80px]"
      )}>
        <div className="h-16 border-b flex items-center px-4 sm:px-6">
          <div className="ml-auto flex items-center gap-4" />
        </div>
        <main className={cn(
          "mx-auto w-full",
          // Responsive padding and max-width
          "p-4 sm:p-6 md:p-8",
          "max-w-screen-xl",
          // Center content on larger screens
          "lg:px-8"
        )}>
          <div className="grid gap-6 sm:gap-8">
            {children}
          </div>
        </main>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed",
        isMobile ? "bottom-0 left-0 right-0" : "inset-y-0 left-0",
        "z-[100]"
      )}>
        <Sidebar />
      </div>
    </div>
  );
}