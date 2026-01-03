import { motion } from 'framer-motion';

import styles from './OffBudgetTransfersToggle.module.css';

interface AllTransfersToggleProps {
  includeAllTransfers: boolean;
  onToggle: (value: boolean) => void;
}

export function AllTransfersToggle({ includeAllTransfers, onToggle }: AllTransfersToggleProps) {
  return (
    <motion.div
      className={styles.toggle}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.35 }}
    >
      <div className={styles.toggleLabel}>
        <span className={styles.toggleText}>Include All Transfers</span>
        <div
          className={`${styles.toggleSwitch} ${includeAllTransfers ? styles.active : ''}`}
          onClick={() => onToggle(!includeAllTransfers)}
          role="switch"
          aria-checked={includeAllTransfers}
          aria-label="Include all transfers"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.code === 'Space') {
              e.preventDefault();
              onToggle(!includeAllTransfers);
            }
          }}
        >
          <div className={styles.toggleSlider} />
        </div>
      </div>
    </motion.div>
  );
}
