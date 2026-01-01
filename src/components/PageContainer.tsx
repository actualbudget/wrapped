import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

import styles from "./PageContainer.module.css";

interface PageContainerProps {
  id: string;
  children: ReactNode;
  className?: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    x: 100,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: -100,
  },
};

export function PageContainer({ id, children, className }: PageContainerProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        id={id}
        className={`${styles.container} ${className || ""}`}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
