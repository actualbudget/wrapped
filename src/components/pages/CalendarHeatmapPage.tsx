import { motion } from "framer-motion";
import { useState } from "react";

import type { WrappedData } from "../../types";

import { CalendarHeatmap } from "../charts/CalendarHeatmap";
import heatmapStyles from "../charts/CalendarHeatmap.module.css";
import { PageContainer } from "../PageContainer";
import styles from "./Page.module.css";

interface CalendarHeatmapPageProps {
  data: WrappedData;
}

export function CalendarHeatmapPage({ data }: CalendarHeatmapPageProps) {
  const [viewMode, setViewMode] = useState<"count" | "amount">("count");
  const totalTransactions = data.calendarData.reduce((sum, day) => sum + day.count, 0);
  const busiestDay = data.calendarData.reduce(
    (max, day) => (day.count > max.count ? day : max),
    data.calendarData[0] || { date: "", count: 0, amount: 0 },
  );

  return (
    <PageContainer id="calendar-heatmap-page">
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
          Transaction Calendar
        </motion.h2>
        <motion.p
          className={styles.sectionSubtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Your financial activity throughout the year
        </motion.p>

        {/* Toggle buttons - centered and outside scrollable area */}
        <motion.div
          className={heatmapStyles.toggleContainer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <button
            className={`${heatmapStyles.toggleButton} ${viewMode === "count" ? heatmapStyles.active : ""}`}
            onClick={() => setViewMode("count")}
          >
            Count
          </button>
          <button
            className={`${heatmapStyles.toggleButton} ${viewMode === "amount" ? heatmapStyles.active : ""}`}
            onClick={() => setViewMode("amount")}
          >
            Amount
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            width: "100%",
            overflowX: "auto",
            overflowY: "hidden",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <CalendarHeatmap data={data.calendarData} year={data.year} viewMode={viewMode} />
        </motion.div>

        <motion.div
          className={styles.statsGrid}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className={styles.statCard}>
            <div className={styles.statValue}>{totalTransactions}</div>
            <div className={styles.statLabel}>Total Transactions</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{busiestDay.count}</div>
            <div className={styles.statLabel}>Busiest Day</div>
            <div
              style={{ fontSize: "0.9rem", color: "rgba(255, 255, 255, 0.6)", marginTop: "0.5rem" }}
            >
              {new Date(busiestDay.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{(totalTransactions / 365).toFixed(1)}</div>
            <div className={styles.statLabel}>Avg Transactions/Day</div>
          </div>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
