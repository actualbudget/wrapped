import { motion } from "framer-motion";
import { useEffect } from "react";

import styles from "./Navigation.module.css";

interface NavigationProps {
  currentPage: number;
  totalPages: number;
  onNext: () => void;
  onPrevious: () => void;
}

export function Navigation({ currentPage, totalPages, onNext, onPrevious }: NavigationProps) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentPage > 0) {
        onPrevious();
      } else if (e.key === "ArrowRight" && currentPage < totalPages - 1) {
        onNext();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentPage, totalPages, onNext, onPrevious]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  return (
    <div className={styles.navigation}>
      <div className={styles.progress}>
        <div className={styles.progressBar}>
          <motion.div
            className={styles.progressFill}
            initial={false}
            animate={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className={styles.progressText}>
          {currentPage + 1} / {totalPages}
        </span>
      </div>

      <div className={styles.controls}>
        <div className={styles.buttons}>
          <motion.button
            className={styles.button}
            onClick={onPrevious}
            disabled={currentPage === 0}
            whileHover={{ scale: currentPage > 0 ? 1.05 : 1 }}
            whileTap={{ scale: currentPage > 0 ? 0.95 : 1 }}
          >
            ← Previous
          </motion.button>
          <motion.button
            className={styles.button}
            onClick={onNext}
            disabled={currentPage === totalPages - 1}
            whileHover={{ scale: currentPage < totalPages - 1 ? 1.05 : 1 }}
            whileTap={{ scale: currentPage < totalPages - 1 ? 0.95 : 1 }}
          >
            Next →
          </motion.button>
        </div>
      </div>
    </div>
  );
}
