import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

interface StepContainerProps {
  children: ReactNode;
  stepKey: string;
}

export function StepContainer({ children, stepKey }: StepContainerProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="w-full max-w-2xl mx-auto"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
