import { motion } from 'framer-motion';

import styles from './OffBudgetToggle.module.css';

interface OffBudgetToggleProps {
  includeOffBudget: boolean;
  onToggle: (value: boolean) => void;
}

export function OffBudgetToggle({ includeOffBudget, onToggle }: OffBudgetToggleProps) {
  return (
    <motion.div
      className={styles.toggle}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className={styles.toggleLabel}>
        <span className={styles.toggleText}>Include Off-Budget</span>
        <div
          className={`${styles.toggleSwitch} ${includeOffBudget ? styles.active : ''}`}
          onClick={() => onToggle(!includeOffBudget)}
          role="switch"
          aria-checked={includeOffBudget}
          aria-label="Include off-budget transactions"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggle(!includeOffBudget);
            }
          }}
        >
          <div className={styles.toggleSlider} />
        </div>
      </div>
    </motion.div>
  );
}
