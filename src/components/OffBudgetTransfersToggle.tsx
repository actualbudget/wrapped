import { motion } from 'framer-motion';

import styles from './OffBudgetTransfersToggle.module.css';

interface OffBudgetTransfersToggleProps {
  includeOffBudgetTransfers: boolean;
  onToggle: (value: boolean) => void;
}

export function OffBudgetTransfersToggle({
  includeOffBudgetTransfers,
  onToggle,
}: OffBudgetTransfersToggleProps) {
  return (
    <motion.div
      className={styles.toggle}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.35 }}
    >
      <div className={styles.toggleLabel}>
        <span className={styles.toggleText}>Include Off-Budget Transfers</span>
        <div
          className={`${styles.toggleSwitch} ${includeOffBudgetTransfers ? styles.active : ''}`}
          onClick={() => onToggle(!includeOffBudgetTransfers)}
          role="switch"
          aria-checked={includeOffBudgetTransfers}
          aria-label="Include off-budget transfers"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.code === 'Space') {
              e.preventDefault();
              onToggle(!includeOffBudgetTransfers);
            }
          }}
        >
          <div className={styles.toggleSlider} />
        </div>
      </div>
    </motion.div>
  );
}
