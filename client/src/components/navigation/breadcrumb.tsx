import { ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <motion.nav 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center space-x-2 text-sm text-muted-foreground",
        className
      )}
    >
      <Link href="/dashboard" className="hover:text-foreground transition-colors">
        <Home className="h-4 w-4" />
      </Link>
      
      {items.map((item, index) => (
        <div key={item.href} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1" />
          <Link
            href={item.href}
            className={cn(
              "hover:text-foreground transition-colors",
              index === items.length - 1 && "text-foreground font-medium"
            )}
          >
            {item.label}
          </Link>
        </div>
      ))}
    </motion.nav>
  );
}
