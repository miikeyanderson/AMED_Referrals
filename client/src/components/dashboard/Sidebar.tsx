import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  BarChart,
  Gift,
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { user, logout } = useUser();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  const NavItem = ({ icon: Icon, label, path, show = true }: { 
    icon: any;
    label: string;
    path: string;
    show?: boolean;
  }) => {
    if (!show) return null;

    const isActive = location === path;

    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
              isCollapsed && "justify-center p-2"
            )}
            onClick={() => setLocation(path)}
          >
            <Icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
            {!isCollapsed && <span>{label}</span>}
          </Button>
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right" className="font-medium">
            {label}
          </TooltipContent>
        )}
      </Tooltip>
    );
  };

  return (
    <motion.div
      initial={false}
      animate={{
        width: isCollapsed ? 80 : 256,
      }}
      className="relative flex h-screen flex-col bg-sidebar border-r"
    >
      <div className={cn(
        "flex items-center p-6",
        isCollapsed && "justify-center p-4"
      )}>
        <h2 className={cn(
          "text-lg font-semibold text-sidebar-foreground",
          isCollapsed && "hidden"
        )}>
          ARM Platform
        </h2>
      </div>

      <div className="px-4 pb-4">
        <div className={cn(
          "flex items-center gap-4 rounded-lg bg-sidebar-accent/10 p-4",
          isCollapsed && "flex-col gap-2"
        )}>
          <Avatar>
            <AvatarImage src={user?.avatar} />
            <AvatarFallback>{user?.name?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-medium text-sidebar-foreground">{user?.name}</span>
              <span className="text-sm text-sidebar-foreground/60 capitalize">{user?.role}</span>
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 border-t">
        <div className="p-4 space-y-2">
          <NavItem
            icon={BarChart}
            label="Analytics"
            path="/analytics"
            show={user?.role === "leadership"}
          />
          <NavItem
            icon={Users}
            label="Referrals"
            path="/referrals"
          />
          <NavItem
            icon={Gift}
            label="Rewards"
            path="/rewards"
            show={user?.role === "clinician"}
          />
          <NavItem
            icon={Settings}
            label="Settings"
            path="/settings"
          />
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50",
                isCollapsed && "justify-center p-2"
              )}
              onClick={handleLogout}
            >
              <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && "Logout"}
            </Button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right" className="font-medium">
              Logout
            </TooltipContent>
          )}
        </Tooltip>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-4 top-6 h-8 w-8 rounded-full border bg-background"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>
    </motion.div>
  );
}