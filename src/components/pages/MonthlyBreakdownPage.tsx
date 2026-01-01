import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import type { WrappedData } from "../../types";

import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";
import { integerToAmount } from "../../services/fileApi";
import { PageContainer } from "../PageContainer";
import styles from "./Page.module.css";

interface MonthlyBreakdownPageProps {
  data: WrappedData;
}

export function MonthlyBreakdownPage({ data }: MonthlyBreakdownPageProps) {
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  // Transaction statistics
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

  // Create chart data - always include all keys for bars to render
  const chartData = useMemo(() => {
    return data.monthlyData.map((month) => ({
      month: month.month.substring(0, 3),
      Income: month.income,
      Expenses: month.expenses,
      Savings: month.netSavings,
    }));
  }, [data.monthlyData]);

  // Calculate Y-axis domain based on visible series only
  const yAxisDomain = useMemo(() => {
    const visibleValues: number[] = [];

    chartData.forEach((dataPoint) => {
      if (!hiddenSeries.has("Income")) {
        visibleValues.push(dataPoint.Income);
      }
      if (!hiddenSeries.has("Expenses")) {
        visibleValues.push(dataPoint.Expenses);
      }
      if (!hiddenSeries.has("Savings")) {
        visibleValues.push(dataPoint.Savings);
      }
    });

    if (visibleValues.length === 0) {
      return [0, 100];
    }

    const min = Math.min(...visibleValues);
    const max = Math.max(...visibleValues);
    const padding = (max - min) * 0.1; // 10% padding

    return [Math.max(0, min - padding), max + padding];
  }, [chartData, hiddenSeries]);

  const handleSeriesClick = (seriesName: string) => {
    setHiddenSeries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(seriesName)) {
        newSet.delete(seriesName);
      } else {
        newSet.add(seriesName);
      }
      return newSet;
    });
  };

  return (
    <PageContainer id="monthly-breakdown-page">
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
          Monthly Breakdown
        </motion.h2>
        <motion.p
          className={styles.sectionSubtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Your income and expenses throughout the year
        </motion.p>

        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              key={Array.from(hiddenSeries).sort().join(",")}
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.8)" />
              <YAxis
                stroke="rgba(255, 255, 255, 0.8)"
                domain={yAxisDomain}
                tickFormatter={(value) => `$${Math.round(value).toLocaleString("en-US")}`}
              />
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
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                content={({ payload }) => (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      gap: "16px",
                    }}
                  >
                    {payload?.map((entry, index) => {
                      const dataKey = typeof entry.dataKey === "string" ? entry.dataKey : undefined;
                      const isHidden = dataKey && hiddenSeries.has(dataKey);
                      return (
                        <div
                          key={`legend-${index}`}
                          onClick={() => dataKey && handleSeriesClick(dataKey)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                            opacity: isHidden ? 0.3 : 1,
                            padding: "4px 8px",
                            borderRadius: "4px",
                            transition: "opacity 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <div
                            style={{
                              width: "12px",
                              height: "12px",
                              backgroundColor: entry.color as string,
                              marginRight: "6px",
                              opacity: isHidden ? 0.3 : 1,
                            }}
                          />
                          <span style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "0.9rem" }}>
                            {entry.value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              />
              <Bar
                dataKey="Income"
                fill="#43e97b"
                animationDuration={1000}
                opacity={hiddenSeries.has("Income") ? 0 : 1}
                style={{ cursor: "pointer" }}
                onClick={() => handleSeriesClick("Income")}
              />
              <Bar
                dataKey="Expenses"
                fill="#764ba2"
                animationDuration={1000}
                opacity={hiddenSeries.has("Expenses") ? 0 : 1}
                style={{ cursor: "pointer" }}
                onClick={() => handleSeriesClick("Expenses")}
              />
              <Bar
                dataKey="Savings"
                fill="#667eea"
                animationDuration={1000}
                opacity={hiddenSeries.has("Savings") ? 0 : 1}
                style={{ cursor: "pointer" }}
                onClick={() => handleSeriesClick("Savings")}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <motion.div
          className={styles.statsGrid}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className={styles.statCard}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 }}
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
            transition={{ delay: 0.7 }}
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
            transition={{ delay: 0.8 }}
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
