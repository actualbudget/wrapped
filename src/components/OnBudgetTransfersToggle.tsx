import { motion } from 'framer-motion';

import styles from './OnBudgetTransfersToggle.module.css';

interface OnBudgetTransfersToggleProps {
  excludeOnBudgetTransfers: boolean;
  onToggle: (value: boolean) => void;
}

export function OnBudgetTransfersToggle({
  excludeOnBudgetTransfers,
  onToggle,
}: OnBudgetTransfersToggleProps) {
  return (
    <motion.div
      className={styles.toggle}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <div className={styles.toggleLabel}>
        <span className={styles.toggleText}>Exclude On-Budget Transfers</span>
        <div
          className={`${styles.toggleSwitch} ${excludeOnBudgetTransfers ? styles.active : ''}`}
          onClick={() => onToggle(!excludeOnBudgetTransfers)}
          role="switch"
          aria-checked={excludeOnBudgetTransfers}
          aria-label="Exclude on-budget transfers"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.code === 'Space') {
              e.preventDefault();
              onToggle(!excludeOnBudgetTransfers);
            }
          }}
        >
          <div className={styles.toggleSlider} />
        </div>
      </div>
    </motion.div>
  );
}
