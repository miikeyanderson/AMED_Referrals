import { ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigation } from "@/hooks/use-navigation";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const { navigate, isNavigating } = useNavigation();

  const handleClick = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!isNavigating) {
      navigate(href);
    }
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center space-x-2 text-sm text-muted-foreground",
        className
      )}
    >
      <Link href="/dashboard" onClick={(e) => handleClick("/dashboard", e)}>
        <a className="hover:text-foreground transition-colors">
          <Home className="h-4 w-4" />
        </a>
      </Link>

      <AnimatePresence mode="wait">
        {items.map((item, index) => (
          <motion.div
            key={item.href}
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, delay: index * 0.1 }}
          >
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link href={item.href} onClick={(e) => handleClick(item.href, e)}>
              <a
                className={cn(
                  "hover:text-foreground transition-colors",
                  index === items.length - 1 && "text-foreground font-medium"
                )}
              >
                {item.label}
              </a>
            </Link>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.nav>
  );
}