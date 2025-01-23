
import React from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/hooks/use-user";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const setLocation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <motion.div
      animate={{
        width: isCollapsed ? 80 : 256,
      }}
      className="fixed flex h-screen flex-col border-r backdrop-blur-sm dark:bg-background light:bg-zinc-900 dark:text-zinc-900 light:text-background"
    >
      <div className={cn(
        "flex items-center p-6",
        isCollapsed && "justify-center"
      )}>
        <h1 className="text-xl font-bold">ARM Platform</h1>
      </div>

      <nav className="flex-1">
        <ul>
          {menuItems.map((item) => (
            <li key={item.path}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start relative",
                  isActive(item.path) && "dark:bg-zinc-200 dark:text-zinc-900 light:bg-zinc-800 light:text-zinc-100",
                  isCollapsed && "justify-center p-2"
                )}
                onClick={() => setLocation(item.path)}
              >
                {item.icon}
                {!isCollapsed && <span>{item.name}</span>}
              </Button>
            </li>
          ))}
        </ul>
      </nav>
    </motion.div>
  );
}
