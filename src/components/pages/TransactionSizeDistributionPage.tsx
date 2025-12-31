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
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";
import type { WrappedData } from "../../types";
import styles from "./Page.module.css";

interface TransactionSizeDistributionPageProps {
  data: WrappedData;
}

const BUCKET_COLORS = ["#667eea", "#764ba2", "#f093fb", "#4facfe", "#43e97b"];

export function TransactionSizeDistributionPage({ data }: TransactionSizeDistributionPageProps) {
  const animatedMedian = useAnimatedNumber(data.transactionSizeDistribution.median, 1500, 2);
  const animatedMode = useAnimatedNumber(data.transactionSizeDistribution.mode, 1500, 2);

  const chartData = data.transactionSizeDistribution.buckets.map((bucket) => ({
    range: bucket.range,
    count: bucket.count,
    percentage: bucket.percentage,
  }));

  const mostCommonBucket = chartData.find(
    (d) => d.range === data.transactionSizeDistribution.mostCommonRange,
  );

  return (
    <PageContainer id="transaction-size-distribution-page">
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
          Transaction Size Distribution
        </motion.h2>
        <motion.p
          className={styles.sectionSubtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          How your transaction sizes are distributed
        </motion.p>

        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="range" stroke="rgba(255, 255, 255, 0.8)" />
              <YAxis stroke="rgba(255, 255, 255, 0.8)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.9)",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                }}
                formatter={(value: number | undefined, name: string | undefined, props: any) => {
                  if (name === "count") {
                    return [
                      `${value} transactions (${props.payload.percentage.toFixed(1)}%)`,
                      "Count",
                    ];
                  }
                  return [value, name];
                }}
              />
              <Bar dataKey="count" animationDuration={1000}>
                {chartData.map((entry, index) => {
                  const isMostCommon =
                    entry.range === data.transactionSizeDistribution.mostCommonRange;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isMostCommon ? "#f093fb" : BUCKET_COLORS[index % BUCKET_COLORS.length]}
                      opacity={isMostCommon ? 1 : 0.7}
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
            <div className={styles.statValue}>${animatedMedian.toFixed(2)}</div>
            <div className={styles.statLabel}>Median Transaction</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>${animatedMode.toFixed(2)}</div>
            <div className={styles.statLabel}>Mode (Most Common)</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{mostCommonBucket?.range || "N/A"}</div>
            <div className={styles.statLabel}>Most Common Range</div>
            <div
              style={{
                fontSize: "0.9rem",
                color: "rgba(255, 255, 255, 0.6)",
                marginTop: "0.5rem",
              }}
            >
              {mostCommonBucket?.count || 0} transactions
            </div>
          </div>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
