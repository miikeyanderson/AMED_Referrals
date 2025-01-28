import { Settings, Users, ChartBar, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { useUser } from "@/hooks/use-user";
import { useNavigation } from "@/hooks/use-navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/navigation/breadcrumb";

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

// Helper function to get breadcrumb items based on current path
const getBreadcrumbItems = (path: string, role: string) => {
  const items = [];
  const parts = path.split('/').filter(Boolean);

  if (parts[0] === 'dashboard') {
    items.push({
      label: role.charAt(0).toUpperCase() + role.slice(1),
      href: `/dashboard/${role}`,
    });
  }

  if (parts.length > 2) {
    const section = parts[2];
    items.push({
      label: section.charAt(0).toUpperCase() + section.slice(1),
      href: `/${parts.slice(0, 3).join('/')}`,
    });
  }

  return items;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { location, canGoBack, canGoForward, goBack, goForward, isNavigating } = useNavigation();
  const isMobile = useIsMobile();

  if (!user) {
    return null;
  }

  const userRoutes = roleRoutes[user.role as keyof typeof roleRoutes] || [];
  const routes = [...userRoutes, ...commonRoutes];
  const breadcrumbItems = getBreadcrumbItems(location, user.role);
  const showNavigation = !isMobile && (canGoBack || canGoForward);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main content */}
      <div className={cn(
        "flex-1 transition-all duration-300",
        isMobile ? "w-full px-4 pb-20" : "pl-[80px]"
      )}>
        <div className="h-16 border-b flex items-center px-4 sm:px-6">
          {/* Navigation controls - only show on desktop when history exists */}
          {showNavigation && (
            <div className="flex items-center gap-2 mr-4">
              <Button
                variant="ghost"
                size="icon"
                disabled={!canGoBack || isNavigating}
                onClick={goBack}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={!canGoForward || isNavigating}
                onClick={goForward}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="h-8 w-px bg-border" />
            </div>
          )}

          {/* Breadcrumb - always show */}
          <Breadcrumb items={breadcrumbItems} />

          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-muted-foreground font-medium">
              Your Next $500 Is Waiting, {user.name}!
            </span>
          </div>
        </div>

        <main className={cn(
          "mx-auto w-full",
          "p-4 sm:p-6 md:p-8",
          "max-w-screen-xl",
          "lg:px-8"
        )}>
          <div className="grid gap-6 sm:gap-8">
            {children}
          </div>
        </main>
      </div>

      {/* Sidebar - separate component */}
      <div className={cn(
        "fixed",
        isMobile ? "bottom-0 left-0 right-0" : "inset-y-0 left-0",
        "z-[100]"
      )}>
        <Sidebar routes={routes} />
      </div>
    </div>
  );
}