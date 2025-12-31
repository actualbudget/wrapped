import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { PageContainer } from "../PageContainer";
import type { WrappedData } from "../../types";
import styles from "./Page.module.css";

interface QuarterlyComparisonPageProps {
  data: WrappedData;
}

export function QuarterlyComparisonPage({ data }: QuarterlyComparisonPageProps) {
  const chartData = data.quarterlyData.map((quarter) => ({
    quarter: quarter.quarter,
    Income: quarter.income,
    Expenses: quarter.expenses,
    Savings: quarter.netSavings,
  }));

  const maxSpending = Math.max(...chartData.map((d) => d.Expenses));
  const highestSpendingQuarter = chartData.find((d) => d.Expenses === maxSpending);
  const lowestSpendingQuarter = chartData.reduce((min, q) => (q.Expenses < min.Expenses ? q : min));

  return (
    <PageContainer id="quarterly-comparison-page">
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
          Quarterly Comparison
        </motion.h2>
        <motion.p
          className={styles.sectionSubtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Your financial performance by quarter
        </motion.p>

        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="quarter" stroke="rgba(255, 255, 255, 0.8)" />
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
                  name ?? "",
                ]}
              />
              <Legend />
              <Bar dataKey="Income" fill="#43e97b" animationDuration={1000} />
              <Bar dataKey="Expenses" fill="#764ba2" animationDuration={1000}>
                {chartData.map((entry, index) => {
                  const isHighest = entry.Expenses === maxSpending;
                  return (
                    <Cell
                      key={`cell-expenses-${index}`}
                      fill={isHighest ? "#f093fb" : "#764ba2"}
                      opacity={isHighest ? 1 : 0.7}
                    />
                  );
                })}
              </Bar>
              <Bar dataKey="Savings" fill="#667eea" animationDuration={1000} />
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
            <div className={styles.statValue}>{highestSpendingQuarter?.quarter || "N/A"}</div>
            <div className={styles.statLabel}>Highest Spending Quarter</div>
            <div
              style={{
                fontSize: "0.9rem",
                color: "rgba(255, 255, 255, 0.6)",
                marginTop: "0.5rem",
              }}
            >
              $
              {highestSpendingQuarter?.Expenses.toLocaleString("en-US", {
                maximumFractionDigits: 0,
              }) || "0"}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{lowestSpendingQuarter.quarter}</div>
            <div className={styles.statLabel}>Lowest Spending Quarter</div>
            <div
              style={{
                fontSize: "0.9rem",
                color: "rgba(255, 255, 255, 0.6)",
                marginTop: "0.5rem",
              }}
            >
              $
              {lowestSpendingQuarter.Expenses.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              $
              {data.quarterlyData
                .reduce((sum, q) => sum + q.netSavings, 0)
                .toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </div>
            <div className={styles.statLabel}>Total Savings (All Quarters)</div>
          </div>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
