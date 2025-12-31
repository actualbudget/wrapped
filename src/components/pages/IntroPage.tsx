import { motion } from "framer-motion";
import { PageContainer } from "../PageContainer";
import type { WrappedData } from "../../types";
import styles from "./Page.module.css";

interface IntroPageProps {
  data: WrappedData;
}

export function IntroPage({ data }: IntroPageProps) {
  return (
    <PageContainer id="intro-page">
      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          Your {data.year} Budget
        </motion.h1>
        <motion.div
          className={styles.subtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Year in Review
        </motion.div>
        <motion.div
          className={styles.statsGrid}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              ${data.totalIncome.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </div>
            <div className={styles.statLabel}>Total Income</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              ${data.totalExpenses.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </div>
            <div className={styles.statLabel}>Total Expenses</div>
          </div>
          <div className={styles.statCard}>
            <div
              className={`${styles.statValue} ${data.netSavings >= 0 ? styles.positive : styles.negative}`}
            >
              ${Math.abs(data.netSavings).toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </div>
            <div className={styles.statLabel}>
              {data.netSavings >= 0 ? "Net Savings" : "Net Loss"}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
