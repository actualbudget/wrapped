import { motion } from 'framer-motion';

import styles from './IncludeIncomeToggle.module.css';

interface IncludeIncomeToggleProps {
  includeIncome: boolean;
  onToggle: (value: boolean) => void;
}

export function IncludeIncomeToggle({ includeIncome, onToggle }: IncludeIncomeToggleProps) {
  return (
    <motion.div
      className={styles.toggle}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className={styles.toggleLabel}>
        <span className={styles.toggleText}>Include Income</span>
        <div
          className={`${styles.toggleSwitch} ${includeIncome ? styles.active : ''}`}
          onClick={() => onToggle(!includeIncome)}
          role="switch"
          aria-checked={includeIncome}
          aria-label="Include income transactions"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.code === 'Space') {
              e.preventDefault();
              onToggle(!includeIncome);
            }
          }}
        >
          <div className={styles.toggleSlider} />
        </div>
      </div>
    </motion.div>
  );
}
