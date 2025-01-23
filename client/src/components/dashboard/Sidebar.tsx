import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { useQuery } from "@tanstack/react-query";
import type { PendingReferralsResponse, NotificationsResponse } from "@/types/api";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Bell,
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  UserPlus,
  Calendar,
  Clock,
  ClipboardList,
  History,
  Gift,
  HelpCircle,
  MessageCircle,
  CalendarClock,
} from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { FeedbackModal } from "./FeedbackModal";

export function Sidebar() {
  const { user, logout } = useUser();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Fetch pending referrals count
  const { data: pendingReferrals } = useQuery<PendingReferralsResponse>({
    queryKey: ['/api/recruiter/referrals/pending/count'],
    enabled: user?.role === 'recruiter',
  });

  // Fetch unread notifications count
  const { data: notifications } = useQuery<NotificationsResponse>({
    queryKey: ['/api/notifications/unread/count'],
    enabled: !!user,
  });

  // Fetch pending rewards count
  const { data: pendingRewards } = useQuery({
    queryKey: ['/api/rewards/pending/count'],
    enabled: user?.role === 'recruiter',
  });

  // Fetch calendar events count
  const { data: calendarEvents } = useQuery({
    queryKey: ['/api/calendar/events/today'],
    enabled: user?.role === 'recruiter',
  });

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

  const QuickAction = ({ 
    icon: Icon, 
    label, 
    onClick,
  }: { 
    icon: any;
    label: string;
    onClick: () => void;
  }) => {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-9 w-9",
              isCollapsed ? "mx-auto" : "w-full"
            )}
            onClick={onClick}
          >
            <Icon className="h-4 w-4" />
            <span className="sr-only">{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  };

  const NavItem = ({ 
    icon: Icon, 
    label, 
    path, 
    badge,
    show = true 
  }: { 
    icon: any;
    label: string;
    path: string;
    badge?: number;
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
              "w-full justify-start relative",
              isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
              isCollapsed && "justify-center p-2"
            )}
            onClick={() => setLocation(path)}
          >
            <Icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
            {!isCollapsed && <span>{label}</span>}
            {badge !== undefined && badge > 0 && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "ml-auto",
                  isCollapsed && "absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center"
                )}
              >
                {badge}
              </Badge>
            )}
          </Button>
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right" className="font-medium">
            {label}
            {badge !== undefined && badge > 0 && ` (${badge})`}
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
      className="fixed z-[100] flex h-screen flex-col border-r backdrop-blur-sm bg-sidebar/98"
      onAnimationComplete={() => {
        document.documentElement.setAttribute('data-sidebar-expanded', (!isCollapsed).toString());
      }}
    >
      <div className={cn(
        "flex items-center p-4 lg:p-6",
        isCollapsed && "justify-center lg:p-4"
      )}>
        <h2 className={cn(
          "text-lg font-semibold text-sidebar-foreground",
          isCollapsed && "hidden"
        )}>
          ARM Platform
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Quick Actions Section */}
          {user?.role === "recruiter" && (
            <div className="space-y-2">
              {!isCollapsed && (
                <h3 className="text-xs font-medium text-sidebar-foreground/70 px-2">
                  Quick Actions
                </h3>
              )}
              <div className={cn(
                "grid gap-2",
                isCollapsed ? "grid-cols-1" : "grid-cols-2"
              )}>
                <QuickAction
                  icon={UserPlus}
                  label="New Referral"
                  onClick={() => setLocation("/referral/new")}
                />
                <QuickAction
                  icon={Calendar}
                  label="Schedule Interview"
                  onClick={() => setLocation("/schedule")}
                />
                <QuickAction
                  icon={Clock}
                  label="Recent Activity"
                  onClick={() => setLocation("/activity")}
                />
                <QuickAction
                  icon={History}
                  label="Recent Candidates"
                  onClick={() => setLocation("/recent")}
                />
              </div>
            </div>
          )}

          {user?.role === "recruiter" && (
            <div className="px-4">
              <div className="h-[1px] bg-border/40 my-4" />
            </div>
          )}

          {/* Navigation Section */}
          {!isCollapsed && (
            <h3 className="text-xs font-medium text-sidebar-foreground/70 px-2">
              Navigation
            </h3>
          )}
          <div className="space-y-2">
            <NavItem
              icon={LayoutDashboard}
              label="Dashboard"
              path="/dashboard"
              show={user?.role === "recruiter"}
            />
            <NavItem
              icon={Users}
              label="Candidate Pipeline"
              path="/pipeline"
              badge={pendingReferrals?.count}
              show={user?.role === "recruiter"}
            />
            <NavItem
              icon={BarChart3}
              label="Performance"
              path="/performance"
              show={user?.role === "recruiter"}
            />
            <NavItem
              icon={Gift}
              label="Rewards"
              path="/rewards"
              badge={pendingRewards?.count}
              show={user?.role === "recruiter"}
            />
            <NavItem
              icon={CalendarClock}
              label="Calendar"
              path="/calendar"
              badge={calendarEvents?.count}
              show={user?.role === "recruiter"}
            />
            <NavItem
              icon={HelpCircle}
              label="Help & Support"
              path="/help"
              show={user?.role === "recruiter"}
            />
            <NavItem
              icon={Bell}
              label="Notifications"
              path="/notifications"
              badge={notifications?.count}
            />
            <NavItem
              icon={Settings}
              label="Settings"
              path="/settings"
            />
          </div>

          {/* Feedback Section */}
          {user?.role === "recruiter" && (
            <div className="mt-6">
              <div className="h-[1px] bg-border/40 mb-4" />
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  isCollapsed && "justify-center p-2"
                )}
                onClick={() => setIsFeedbackModalOpen(true)}
              >
                <MessageCircle className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                {!isCollapsed && <span>Have Feedback?</span>}
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 pb-2">
        <div className={cn(
          "flex items-center gap-4 rounded-lg bg-sidebar-accent/10 p-4",
          isCollapsed && "flex-col gap-2"
        )}>
          <Avatar>
            <AvatarImage src={user?.avatar} />
            <AvatarFallback>{user?.name?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col flex-1">
              <span className="font-medium text-sidebar-foreground">{user?.name}</span>
              <span className="text-sm text-sidebar-foreground/60 capitalize">{user?.role}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t space-y-2">
        <div className={cn(
          "flex items-center justify-center",
          isCollapsed && "flex-col"
        )}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                className={cn(isCollapsed && "h-8 w-8")}
              >
                <span className="sr-only">Toggle theme</span>
                {theme === "dark" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Switch>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">Toggle theme</TooltipContent>
            )}
          </Tooltip>
        </div>

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
        <span className="sr-only">
          {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        </span>
      </Button>
      <FeedbackModal
        open={isFeedbackModalOpen}
        onOpenChange={setIsFeedbackModalOpen}
      />
    </motion.div>
  );
}