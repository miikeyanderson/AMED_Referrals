import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  BarChart,
  Gift,
  LogOut,
  Settings,
} from "lucide-react";
import { useLocation } from "wouter";

export function Sidebar() {
  const { user, logout } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
        return;
      }
      setLocation("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <div className="flex flex-col w-64 bg-sidebar border-r">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-sidebar-foreground">ARM Platform</h2>
      </div>
      <ScrollArea className="flex-1 border-t">
        <div className="p-4 space-y-2">
          {user?.role === "leadership" && (
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setLocation("/analytics")}
            >
              <BarChart className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setLocation("/referrals")}
          >
            <Users className="mr-2 h-4 w-4" />
            Referrals
          </Button>
          {user?.role === "clinician" && (
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setLocation("/rewards")}
            >
              <Gift className="mr-2 h-4 w-4" />
              Rewards
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setLocation("/settings")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
