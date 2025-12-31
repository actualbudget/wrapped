import { motion } from "framer-motion";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { PageContainer } from "../PageContainer";
import type { WrappedData } from "../../types";
import styles from "./Page.module.css";

interface CategoryTrendsPageProps {
  data: WrappedData;
}

const TREND_COLORS = [
  "#667eea",
  "#764ba2",
  "#f093fb",
  "#4facfe",
  "#43e97b",
  "#fa709a",
  "#fee140",
  "#30cfd0",
  "#a8edea",
  "#fed6e3",
];

export function CategoryTrendsPage({ data }: CategoryTrendsPageProps) {
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());

  // Transform data for the chart
  const months = data.categoryTrends[0]?.monthlyData.map((m) => m.month.substring(0, 3)) || [];

  const chartData = months.map((month, index) => {
    const dataPoint: any = { month };

    // First, collect all visible category values for this month to find the max
    const visibleValues: number[] = [];
    data.categoryTrends.forEach((trend) => {
      const isHidden = hiddenCategories.has(trend.categoryId);
      if (!isHidden) {
        const value = trend.monthlyData[index]?.amount || 0;
        visibleValues.push(value);
      }
    });
    const maxVisibleValue = visibleValues.length > 0 ? Math.max(...visibleValues) : 0;

    // Now set values - use max visible value for hidden categories
    // Also store original values for tooltip
    data.categoryTrends.forEach((trend) => {
      const isHidden = hiddenCategories.has(trend.categoryId);
      const originalValue = trend.monthlyData[index]?.amount || 0;

      if (isHidden) {
        dataPoint[trend.categoryName] = maxVisibleValue;
        // Store original value for tooltip access
        dataPoint[`${trend.categoryName}_original`] = originalValue;
      } else {
        dataPoint[trend.categoryName] = originalValue;
      }
    });

    return dataPoint;
  });

  const handleCategoryClick = (categoryId: string) => {
    setHiddenCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string> & {
    payload?: Array<{ value?: number; dataKey?: string; name?: string; color?: string }>;
    label?: string;
  }) => {
    if (!active || !payload || !payload.length) return null;

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
        <p style={{ margin: "0 0 8px 0", color: "#ffffff", fontWeight: "bold" }}>{label}</p>
        {payload.map(
          (
            entry: { value?: number; dataKey?: string; name?: string; color?: string },
            index: number,
          ) => {
            if (!entry.value && entry.value !== 0) return null;

            const trend = data.categoryTrends.find((t) => t.categoryName === entry.dataKey);
            const isHidden = trend && hiddenCategories.has(trend.categoryId);

            // Find the month index to get original value
            const monthIndex = chartData.findIndex((d) => d.month === label);
            let displayValue = entry.value;

            if (isHidden && trend && monthIndex >= 0) {
              // Use original value for hidden categories
              displayValue = trend.monthlyData[monthIndex]?.amount || 0;
            }

            // Don't show zero values for hidden categories (when no original value)
            if (isHidden && displayValue === 0) return null;

            return (
              <p key={index} style={{ margin: "4px 0", color: entry.color || "#ffffff" }}>
                <span style={{ marginRight: "8px" }}>{entry.name}:</span>$
                {Math.round(displayValue).toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </p>
            );
          },
        )}
      </div>
    );
  };

  return (
    <PageContainer id="category-trends-page">
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
          Category Trends
        </motion.h2>
        <motion.p
          className={styles.sectionSubtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Spending patterns for your top categories
        </motion.p>

        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.8)" />
              <YAxis stroke="rgba(255, 255, 255, 0.8)" />
              <Tooltip content={<CustomTooltip />} />
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
                      const trend = data.categoryTrends.find(
                        (t) => t.categoryName === entry.dataKey,
                      );
                      const isHidden = trend && hiddenCategories.has(trend.categoryId);
                      return (
                        <div
                          key={`legend-${index}`}
                          onClick={() => trend && handleCategoryClick(trend.categoryId)}
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
              {data.categoryTrends.map((trend, index) => {
                const isHidden = hiddenCategories.has(trend.categoryId);
                return (
                  <Line
                    key={trend.categoryId}
                    type="monotone"
                    dataKey={trend.categoryName}
                    stroke={TREND_COLORS[index % TREND_COLORS.length]}
                    strokeWidth={3}
                    strokeOpacity={isHidden ? 0.15 : 1}
                    dot={{ r: isHidden ? 0 : 4 }}
                    activeDot={{ r: isHidden ? 0 : 6 }}
                    onClick={() => handleCategoryClick(trend.categoryId)}
                    style={{ cursor: "pointer" }}
                    animationDuration={1000}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </PageContainer>
  );
}
