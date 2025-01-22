import { Settings } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";

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
      <Sidebar />

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
