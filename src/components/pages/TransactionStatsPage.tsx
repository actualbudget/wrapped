import { motion } from "framer-motion";
import { PageContainer } from "../PageContainer";
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";
import { integerToAmount } from "../../services/fileApi";
import type { WrappedData } from "../../types";
import styles from "./Page.module.css";

interface TransactionStatsPageProps {
  data: WrappedData;
}

export function TransactionStatsPage({ data }: TransactionStatsPageProps) {
  const animatedCount = useAnimatedNumber(data.transactionStats.totalCount, 1500, 0);
  const animatedAverage = useAnimatedNumber(data.transactionStats.averageAmount, 1500, 2);
  const largestAmount = data.transactionStats.largestTransaction
    ? integerToAmount(Math.abs(data.transactionStats.largestTransaction.amount))
    : 0;
  const animatedLargest = useAnimatedNumber(largestAmount, 1500, 2);

  const formatAmount = (value: number) => {
    if (value >= 10000) {
      return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
    }
    return value.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  };

  return (
    <PageContainer id="transaction-stats-page">
      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h2
          className={styles.sectionTitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Transaction Statistics
        </motion.h2>
        <motion.p
          className={styles.sectionSubtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          A look at your spending activity
        </motion.p>

        <motion.div
          className={styles.statsGrid}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div
            className={styles.statCard}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className={styles.largeNumber} style={{ fontSize: "clamp(1.8rem, 5vw, 3.5rem)" }}>
              {animatedCount.toLocaleString("en-US")}
            </div>
            <div className={styles.statLabel}>Total Transactions</div>
          </motion.div>

          <motion.div
            className={styles.statCard}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className={styles.largeNumber} style={{ fontSize: "clamp(1.8rem, 5vw, 3.5rem)" }}>
              ${formatAmount(animatedAverage)}
            </div>
            <div className={styles.statLabel}>Average Transaction</div>
          </motion.div>

          <motion.div
            className={styles.statCard}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className={styles.largeNumber} style={{ fontSize: "clamp(1.8rem, 5vw, 3.5rem)" }}>
              ${formatAmount(animatedLargest)}
            </div>
            <div className={styles.statLabel}>Largest Transaction</div>
            {data.transactionStats.largestTransaction && (
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "rgba(255, 255, 255, 0.6)",
                  marginTop: "0.5rem",
                  textAlign: "center",
                }}
              >
                {data.transactionStats.largestTransaction.payee_name || "Unknown payee"}
              </div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
