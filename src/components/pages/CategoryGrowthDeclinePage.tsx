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

interface CategoryGrowthDeclinePageProps {
  data: WrappedData;
}

const GROWTH_COLORS = {
  positive: "#43e97b",
  negative: "#fa709a",
  neutral: "#667eea",
};

export function CategoryGrowthDeclinePage({ data }: CategoryGrowthDeclinePageProps) {
  // Sort by percentage change, showing biggest increases and decreases
  const sortedGrowth = [...data.categoryGrowth]
    .sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange))
    .slice(0, 10);

  const chartData = sortedGrowth.map((cat) => ({
    name:
      cat.categoryName.length > 15 ? cat.categoryName.substring(0, 15) + "..." : cat.categoryName,
    fullName: cat.categoryName,
    percentageChange: cat.percentageChange,
    totalChange: cat.totalChange,
  }));

  const topGrowing = sortedGrowth
    .filter((cat) => cat.percentageChange > 0)
    .sort((a, b) => b.percentageChange - a.percentageChange)
    .slice(0, 3);
  const topDeclining = sortedGrowth
    .filter((cat) => cat.percentageChange < 0)
    .sort((a, b) => a.percentageChange - b.percentageChange)
    .slice(0, 3);

  return (
    <PageContainer id="category-growth-decline-page">
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
          Category Growth & Decline
        </motion.h2>
        <motion.p
          className={styles.sectionSubtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Categories with the biggest changes this year
        </motion.p>

        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="name" stroke="rgba(255, 255, 255, 0.8)" />
              <YAxis stroke="rgba(255, 255, 255, 0.8)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.9)",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                }}
                formatter={(value: number | undefined, _name: string | undefined, props: any) => [
                  `${(value ?? 0).toFixed(1)}%`,
                  `Change: $${props.payload.totalChange.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
                ]}
              />
              <Bar dataKey="percentageChange" animationDuration={1000}>
                {chartData.map((entry, index) => {
                  const isPositive = entry.percentageChange > 0;
                  const isNegative = entry.percentageChange < 0;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        isPositive
                          ? GROWTH_COLORS.positive
                          : isNegative
                            ? GROWTH_COLORS.negative
                            : GROWTH_COLORS.neutral
                      }
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
          {topGrowing.length > 0 && (
            <div className={styles.statCard}>
              <div className={styles.statValue} style={{ color: GROWTH_COLORS.positive }}>
                {topGrowing[0]?.categoryName || "N/A"}
              </div>
              <div className={styles.statLabel}>Top Growing Category</div>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "rgba(255, 255, 255, 0.6)",
                  marginTop: "0.5rem",
                }}
              >
                +{topGrowing[0]?.percentageChange.toFixed(1)}% increase
              </div>
            </div>
          )}
          {topDeclining.length > 0 && (
            <div className={styles.statCard}>
              <div className={styles.statValue} style={{ color: GROWTH_COLORS.negative }}>
                {topDeclining[0]?.categoryName || "N/A"}
              </div>
              <div className={styles.statLabel}>Top Declining Category</div>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "rgba(255, 255, 255, 0.6)",
                  marginTop: "0.5rem",
                }}
              >
                {topDeclining[0]?.percentageChange.toFixed(1)}% decrease
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
