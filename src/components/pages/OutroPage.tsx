import { motion } from 'framer-motion';

import type { WrappedData } from '../../types';

import { PageContainer } from '../PageContainer';
import styles from './Page.module.css';

interface OutroPageProps {
  data: WrappedData;
}

export function OutroPage({ data }: OutroPageProps) {
  return (
    <PageContainer id="outro-page">
      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          Thanks for using Actual Budget!
        </motion.h1>
        <motion.div
          className={styles.subtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Here&apos;s to another great year of budgeting in {data.year + 1}
        </motion.div>

        <motion.div
          className={styles.statsGrid}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              ${data.totalIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className={styles.statLabel}>Income</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              ${data.totalExpenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className={styles.statLabel}>Expenses</div>
          </div>
          <div className={styles.statCard}>
            <div
              className={`${styles.statValue} ${data.netSavings >= 0 ? styles.positive : styles.negative}`}
            >
              ${Math.abs(data.netSavings).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className={styles.statLabel}>{data.netSavings >= 0 ? 'Saved' : 'Overspent'}</div>
          </div>
        </motion.div>

        <motion.div
          style={{
            marginTop: '3rem',
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <p
            style={{
              fontSize: '1.2rem',
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            Keep tracking, keep budgeting, and keep achieving your financial goals! 🎉
          </p>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
