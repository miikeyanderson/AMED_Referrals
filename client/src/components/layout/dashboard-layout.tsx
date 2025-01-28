import { Settings, Users, ChartBar, ClipboardList, Gift } from "lucide-react";
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
        <div className="h-20 border-b flex items-center justify-between px-4 sm:px-6">
          <div className="flex flex-col items-center flex-grow">
            <div className="text-2xl font-bold leading-tight text-primary animate-fade-in flex items-center gap-2">
              Your Next <span className="text-green-400 font-extrabold animate-pulse">$500</span> Is Waiting, {user.name}
              <span className="inline-block animate-bounce">
                <Gift className="h-6 w-6 text-green-400" />
              </span>
            </div>
            {/*<div className="text-lg font-medium text-muted-foreground/90 mt-1 animate-slide-in">
              {user.name}
            </div>*/}
          </div>
          <button 
            onClick={() => window.location.href = '/dashboard/clinician'}
            className="ml-4 px-6 py-2 bg-green-500 text-white font-medium rounded-full hover:bg-green-600 transition-colors duration-200 shadow-sm"
          >
            Refer Now
          </button>
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