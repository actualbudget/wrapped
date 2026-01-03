import { motion } from 'framer-motion';

import styles from './OnBudgetTransfersToggle.module.css';

interface OnBudgetTransfersToggleProps {
  includeOnBudgetTransfers: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
}

export function OnBudgetTransfersToggle({
  includeOnBudgetTransfers,
  onToggle,
  disabled = false,
}: OnBudgetTransfersToggleProps) {
  return (
    <motion.div
      className={styles.toggle}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <div className={styles.toggleLabel}>
        <span className={styles.toggleText}>Include Budgeted Transfers</span>
        <div
          className={`${styles.toggleSwitch} ${includeOnBudgetTransfers ? styles.active : ''} ${disabled ? styles.disabled : ''}`}
          onClick={() => !disabled && onToggle(!includeOnBudgetTransfers)}
          role="switch"
          aria-checked={includeOnBudgetTransfers}
          aria-label="Include budgeted transfers"
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={e => {
            if (!disabled && (e.key === 'Enter' || e.code === 'Space')) {
              e.preventDefault();
              onToggle(!includeOnBudgetTransfers);
            }
          }}
        >
          <div className={styles.toggleSlider} />
        </div>
      </div>
    </motion.div>
  );
}
