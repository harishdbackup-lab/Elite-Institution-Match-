import { motion } from "framer-motion";
import { cn } from "@/src/lib/utils";
import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
}

export function GlassCard({ children, className, delay = 0, onClick }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={onClick ? { 
        y: -5, 
        scale: 1.01,
        transition: { duration: 0.3 }
      } : {}}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm",
        onClick ? "cursor-pointer hover:shadow-md hover:border-blue-200" : "",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
}
