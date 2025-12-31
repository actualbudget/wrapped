import { motion } from "framer-motion";
import { PageContainer } from "../PageContainer";
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";
import type { WrappedData } from "../../types";
import styles from "./Page.module.css";

interface SpendingStreaksPageProps {
  data: WrappedData;
}

export function SpendingStreaksPage({ data }: SpendingStreaksPageProps) {
  const animatedSpendingStreak = useAnimatedNumber(
    data.spendingStreaks.longestSpendingStreak.days,
    1500,
    0,
  );
  const animatedNoSpendingStreak = useAnimatedNumber(
    data.spendingStreaks.longestNoSpendingStreak.days,
    1500,
    0,
  );

  return (
    <PageContainer id="spending-streaks-page">
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
          Spending Streaks
        </motion.h2>
        <motion.p
          className={styles.sectionSubtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Your longest spending patterns
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
            <div className={styles.largeNumber} style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}>
              {animatedSpendingStreak.toLocaleString("en-US")}
            </div>
            <div className={styles.statLabel}>Longest Spending Streak</div>
            <div
              style={{
                fontSize: "0.9rem",
                color: "rgba(255, 255, 255, 0.6)",
                marginTop: "0.5rem",
              }}
            >
              {data.spendingStreaks.longestSpendingStreak.startDate &&
              data.spendingStreaks.longestSpendingStreak.endDate
                ? `${new Date(data.spendingStreaks.longestSpendingStreak.startDate).toLocaleDateString()} - ${new Date(data.spendingStreaks.longestSpendingStreak.endDate).toLocaleDateString()}`
                : "No streak data"}
            </div>
          </motion.div>

          <motion.div
            className={styles.statCard}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className={styles.largeNumber} style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}>
              {animatedNoSpendingStreak.toLocaleString("en-US")}
            </div>
            <div className={styles.statLabel}>Longest No-Spending Streak</div>
            <div
              style={{
                fontSize: "0.9rem",
                color: "rgba(255, 255, 255, 0.6)",
                marginTop: "0.5rem",
              }}
            >
              {data.spendingStreaks.longestNoSpendingStreak.startDate &&
              data.spendingStreaks.longestNoSpendingStreak.endDate
                ? `${new Date(data.spendingStreaks.longestNoSpendingStreak.startDate).toLocaleDateString()} - ${new Date(data.spendingStreaks.longestNoSpendingStreak.endDate).toLocaleDateString()}`
                : "No streak data"}
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className={styles.statsGrid}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className={styles.statCard}>
            <div className={styles.statValue}>{data.spendingStreaks.totalSpendingDays}</div>
            <div className={styles.statLabel}>Days with Spending</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{data.spendingStreaks.totalNoSpendingDays}</div>
            <div className={styles.statLabel}>Days without Spending</div>
          </div>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
