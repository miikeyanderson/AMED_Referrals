jsx
import Link from 'next/link';
import { motion } from 'framer-motion';
import cn from 'classnames';

function Breadcrumbs({ items }) {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center">
            <Link href={item.href}>
              <motion.span
                className={cn(
                  "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
                  index === items.length - 1 && "text-foreground"
                )}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {item.label}
              </motion.span>
            </Link>
            {index < items.length - 1 && (
              <span className="mx-1 text-muted-foreground">/</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;