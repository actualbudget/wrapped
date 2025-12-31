import { motion } from "framer-motion";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  TooltipProps,
} from "recharts";
import { PageContainer } from "../PageContainer";
import type { WrappedData } from "../../types";
import styles from "./Page.module.css";

interface TopMonthsPageProps {
  data: WrappedData;
}

export function TopMonthsPage({ data }: TopMonthsPageProps) {
  const [hiddenMonths, setHiddenMonths] = useState<Set<string>>(new Set());

  // Get all months sorted by spending
  const allMonths = data.monthlyData
    .map((m) => ({ month: m.month, spending: m.expenses }))
    .sort((a, b) => b.spending - a.spending);

  const chartData = allMonths.map((m) => ({
    id: m.month, // Use full month name as unique identifier
    month: m.month.substring(0, 3),
    fullMonth: m.month,
    spending: m.spending,
  }));

  const maxSpending = Math.max(...chartData.map((d) => d.spending));

  const handleMonthClick = (monthId: string) => {
    setHiddenMonths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(monthId)) {
        newSet.delete(monthId);
      } else {
        newSet.add(monthId);
      }
      return newSet;
    });
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string> & {
    payload?: Array<{ value?: number; payload?: any }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      const value = entry.value;
      const monthData = chartData.find((d) => d.month === label);
      const isHidden = monthData && hiddenMonths.has(monthData.id);

      // Use original amount - either from payload's originalSpending or from chartData
      const payloadData = entry.payload as any;
      const displayValue =
        payloadData?.originalSpending ?? (isHidden && monthData ? monthData.spending : value);

      return (
        <div
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            border: "none",
            borderRadius: "8px",
            padding: "12px",
            color: "#ffffff",
          }}
        >
          <p style={{ margin: "0 0 8px 0", color: "#ffffff", fontWeight: "bold" }}>
            {monthData?.fullMonth || label}
          </p>
          <p style={{ margin: 0, color: "#ffffff" }}>
            Spending: $
            {typeof displayValue === "number"
              ? Math.round(displayValue).toLocaleString("en-US")
              : "0"}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <PageContainer id="top-months-page">
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
          Spending by Month
        </motion.h2>
        <motion.p
          className={styles.sectionSubtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Your highest spending months
        </motion.p>

        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              data={chartData.map((entry) => {
                const isHidden = hiddenMonths.has(entry.id);
                // Keep a minimum value for hidden bars so they remain clickable
                // Use a percentage of the max visible amount
                const visibleEntries = chartData.filter((e) => !hiddenMonths.has(e.id));
                const maxVisibleSpending =
                  visibleEntries.length > 0
                    ? Math.max(...visibleEntries.map((e) => e.spending))
                    : entry.spending;
                const minClickableSpending = maxVisibleSpending * 0.05; // 5% of max for better clickability
                return {
                  ...entry,
                  spending: isHidden ? minClickableSpending : entry.spending,
                  originalSpending: entry.spending, // Store original for tooltip
                };
              })}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.8)" />
              <YAxis stroke="rgba(255, 255, 255, 0.8)" />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255, 255, 255, 0.1)" }} />
              <Bar dataKey="spending" animationDuration={1000}>
                {chartData.map((entry, index) => {
                  const isHidden = hiddenMonths.has(entry.id);
                  const isMaxSpending = entry.spending === maxSpending;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isMaxSpending ? "#f093fb" : "#667eea"}
                      opacity={isHidden ? 0.15 : isMaxSpending ? 1 : 0.7}
                      onClick={() => handleMonthClick(entry.id)}
                      style={{ cursor: "pointer" }}
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
          {data.topMonths.map((month, index) => (
            <div key={month.month} className={styles.statCard}>
              <div className={styles.statValue}>
                ${month.spending.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </div>
              <div className={styles.statLabel}>{month.month}</div>
              <div style={{ fontSize: "1.5rem", marginTop: "0.5rem" }}>
                {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
