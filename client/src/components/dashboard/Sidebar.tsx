import { useState, useEffect } from "react";
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
import { useIsMobile } from "@/hooks/use-mobile";
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
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { FeedbackModal } from "./FeedbackModal";

interface NavItemProps {
  icon: any;
  label: string;
  path: string;
  badge?: number;
  priority?: number;
  show?: boolean;
}

interface SidebarProps {
  routes: {
    icon: any;
    label: string;
    href: string;
  }[];
}

export function Sidebar({ routes }: SidebarProps) {
  const { user, logout } = useUser();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const [loadedItems, setLoadedItems] = useState<number[]>([]);

  // Progressive loading effect
  useEffect(() => {
    const priorities = [1, 2, 3];
    priorities.forEach((priority, index) => {
      setTimeout(() => {
        setLoadedItems(prev => [...prev, priority]);
      }, index * 150);
    });
  }, []);

  // Haptic feedback function
  const triggerHapticFeedback = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  // Queries
  const { data: pendingReferrals } = useQuery<PendingReferralsResponse>({
    queryKey: ['/api/recruiter/referrals/pending/count'],
    enabled: user?.role === 'recruiter',
  });

  const { data: notifications } = useQuery<NotificationsResponse>({
    queryKey: ['/api/notifications/unread/count'],
    enabled: !!user,
  });

  const { data: pendingRewards } = useQuery({
    queryKey: ['/api/rewards/pending/count'],
    enabled: user?.role === 'recruiter',
  });

  const { data: calendarEvents } = useQuery({
    queryKey: ['/api/calendar/events/today'],
    enabled: user?.role === 'recruiter',
  });

  const handleLogout = async () => {
    triggerHapticFeedback();
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

  const NavItem = ({ 
    icon: Icon, 
    label, 
    path, 
    badge,
    priority = 1,
    show = true 
  }: NavItemProps) => {
    if (!show) return null;

    const isActive = location === path;
    const isLoaded = loadedItems.includes(priority);

    return (
      <AnimatePresence>
        {isLoaded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "relative min-w-[44px] min-h-[44px]",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                    isMobile && "w-12 h-12 p-0 flex flex-col items-center justify-center",
                    !isMobile && "w-full justify-start",
                    isCollapsed && !isMobile && "justify-center p-2"
                  )}
                  onClick={() => {
                    triggerHapticFeedback();
                    setLocation(path);
                  }}
                >
                  <Icon className={cn(
                    "shrink-0",
                    isMobile ? "h-6 w-6" : "h-4 w-4",
                    !isCollapsed && !isMobile && "mr-2"
                  )} />
                  {!isCollapsed && !isMobile && <span>{label}</span>}
                  {badge !== undefined && badge > 0 && (
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center",
                        !isMobile && !isCollapsed && "static ml-auto"
                      )}
                    >
                      {badge}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              {(isCollapsed || isMobile) && (
                <TooltipContent 
                  side={isMobile ? "top" : "right"} 
                  className="font-medium"
                  sideOffset={isMobile ? 16 : 4}
                >
                  {label}
                  {badge !== undefined && badge > 0 && ` (${badge})`}
                </TooltipContent>
              )}
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const sidebarClassName = cn(
    "z-[100] flex border-r backdrop-blur-sm bg-sidebar/95",
    isMobile
      ? "fixed bottom-0 left-0 right-0 h-16 flex-row items-center justify-around border-t"
      : "fixed h-screen flex-col"
  );

  return (
    <motion.div
      initial={false}
      animate={{
        width: isMobile ? "100%" : isCollapsed ? 80 : 256,
      }}
      className={sidebarClassName}
    >
      {!isMobile && (
        <>
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
              {routes.map((route, index) => (
                <NavItem
                  key={route.href}
                  icon={route.icon}
                  label={route.label}
                  path={route.href}
                  priority={Math.floor(index / 3) + 1}
                />
              ))}
            </div>
          </ScrollArea>
        </>
      )}

      {isMobile ? (
        <div className="flex items-center justify-around w-full px-4">
          {routes
            .filter(item => item.priority <=1)
            .map((item) => (
              <NavItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                path={item.href}
              />
            ))}
        </div>
      ) : (
        <>
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

          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-4 top-6 h-8 w-8 rounded-full border bg-background"
            onClick={() => {
              triggerHapticFeedback();
              setIsCollapsed(!isCollapsed);
            }}
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
        </>
      )}

      <FeedbackModal
        open={isFeedbackModalOpen}
        onOpenChange={setIsFeedbackModalOpen}
      />
    </motion.div>
  );
}