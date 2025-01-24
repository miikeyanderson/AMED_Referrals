import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Trophy,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: number;
  type: "update" | "milestone" | "alert";
  message: string;
  read: boolean;
  createdAt: string;
}

const NOTIFICATION_LIMIT = 5;

export function NotificationsFeed() {
  const [showAll, setShowAll] = useState(false);

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/clinician/notifications"],
    queryFn: async () => {
      const response = await fetch("/api/clinician/notifications");
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      const data = await response.json();
      // Ensure we always return an array
      return Array.isArray(data) ? data : (data?.notifications || []);
    },
  });

  const handleMarkAsRead = async (id: number) => {
    try {
      const response = await fetch(`/api/clinician/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "milestone":
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case "alert":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const groupedNotifications = notifications?.reduce((groups, notification) => {
    const group = notification.type;
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>) || {};

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedNotifications = showAll
    ? notifications
    : notifications?.slice(0, NOTIFICATION_LIMIT);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {Object.entries(groupedNotifications).map(([type, items]) => (
            <div key={type} className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2 capitalize">
                {type}
              </h3>
              <div className="space-y-2">
                {items.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-4 p-3 rounded-lg transition-colors",
                      notification.read
                        ? "bg-muted/50"
                        : "bg-muted hover:bg-muted/80"
                    )}
                    onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                  >
                    <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1">
                      <p className={cn(
                        "text-sm",
                        !notification.read && "font-medium"
                      )}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </ScrollArea>

        {notifications && notifications.length > NOTIFICATION_LIMIT && (
          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => setShowAll(!showAll)}
          >
            <span>{showAll ? "Show Less" : "View All"}</span>
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
