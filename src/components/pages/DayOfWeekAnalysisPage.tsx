import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { PageContainer } from "../PageContainer";
import type { WrappedData } from "../../types";
import styles from "./Page.module.css";

interface DayOfWeekAnalysisPageProps {
  data: WrappedData;
}

const DAY_COLORS = ["#667eea", "#764ba2", "#f093fb", "#4facfe", "#43e97b", "#fa709a", "#fee140"];

export function DayOfWeekAnalysisPage({ data }: DayOfWeekAnalysisPageProps) {
  const chartData = data.dayOfWeekSpending.map((day) => ({
    day: day.dayName.substring(0, 3),
    fullDay: day.dayName,
    spending: day.totalSpending,
    transactionCount: day.transactionCount,
    averageTransactionSize: day.averageTransactionSize,
  }));

  const maxSpending = Math.max(...chartData.map((d) => d.spending));
  const mostExpensiveDay = chartData.find((d) => d.spending === maxSpending);
  const leastExpensiveDay = chartData.reduce((min, day) =>
    day.spending < min.spending ? day : min,
  );

  const weekdaySpending = data.dayOfWeekSpending
    .filter((d) => d.dayOfWeek >= 1 && d.dayOfWeek <= 5)
    .reduce((sum, d) => sum + d.totalSpending, 0);
  const weekendSpending = data.dayOfWeekSpending
    .filter((d) => d.dayOfWeek === 0 || d.dayOfWeek === 6)
    .reduce((sum, d) => sum + d.totalSpending, 0);

  return (
    <PageContainer id="day-of-week-analysis-page">
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
          Day of Week Analysis
        </motion.h2>
        <motion.p
          className={styles.sectionSubtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          When you spend the most throughout the week
        </motion.p>

        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="day" stroke="rgba(255, 255, 255, 0.8)" />
              <YAxis stroke="rgba(255, 255, 255, 0.8)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.9)",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                }}
                formatter={(value: number | undefined, name: string | undefined) => [
                  `$${Math.round(value ?? 0).toLocaleString("en-US")}`,
                  name === "spending" ? "Spending" : name,
                ]}
              />
              <Bar dataKey="spending" animationDuration={1000}>
                {chartData.map((entry, index) => {
                  const isMostExpensive = entry.spending === maxSpending;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isMostExpensive ? "#f093fb" : DAY_COLORS[index % DAY_COLORS.length]}
                      opacity={isMostExpensive ? 1 : 0.7}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <motion.div
          className={styles.statsGrid}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className={styles.statCard}>
            <div className={styles.statValue}>{mostExpensiveDay?.fullDay || "N/A"}</div>
            <div className={styles.statLabel}>Most Expensive Day</div>
            <div
              style={{
                fontSize: "0.9rem",
                color: "rgba(255, 255, 255, 0.6)",
                marginTop: "0.5rem",
              }}
            >
              $
              {mostExpensiveDay?.spending.toLocaleString("en-US", { maximumFractionDigits: 0 }) ||
                "0"}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{leastExpensiveDay.fullDay}</div>
            <div className={styles.statLabel}>Least Expensive Day</div>
            <div
              style={{
                fontSize: "0.9rem",
                color: "rgba(255, 255, 255, 0.6)",
                marginTop: "0.5rem",
              }}
            >
              ${leastExpensiveDay.spending.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              ${weekdaySpending.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </div>
            <div className={styles.statLabel}>Weekday Spending</div>
            <div
              style={{
                fontSize: "0.9rem",
                color: "rgba(255, 255, 255, 0.6)",
                marginTop: "0.5rem",
              }}
            >
              ${weekendSpending.toLocaleString("en-US", { maximumFractionDigits: 0 })} on weekends
            </div>
          </div>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
