import { motion } from 'framer-motion';

import styles from './CategoryIncomeToggle.module.css';

interface CategoryIncomeToggleProps {
  includeIncomeInCategories: boolean;
  onToggle: (value: boolean) => void;
}

export function CategoryIncomeToggle({
  includeIncomeInCategories,
  onToggle,
}: CategoryIncomeToggleProps) {
  return (
    <motion.div
      className={styles.toggle}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className={styles.toggleLabel}>
        <span className={styles.toggleText}>Net Totals</span>
        <div
          className={`${styles.toggleSwitch} ${includeIncomeInCategories ? styles.active : ''}`}
          onClick={() => onToggle(!includeIncomeInCategories)}
          role="switch"
          aria-checked={includeIncomeInCategories}
          aria-label="Include income in net totals"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.code === 'Space') {
              e.preventDefault();
              onToggle(!includeIncomeInCategories);
            }
          }}
        >
          <div className={styles.toggleSlider} />
        </div>
      </div>
    </motion.div>
  );
}
