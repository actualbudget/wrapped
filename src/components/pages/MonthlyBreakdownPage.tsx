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
} from "recharts";
import { PageContainer } from "../PageContainer";
import type { WrappedData } from "../../types";
import styles from "./Page.module.css";

interface MonthlyBreakdownPageProps {
  data: WrappedData;
}

export function MonthlyBreakdownPage({ data }: MonthlyBreakdownPageProps) {
  const chartData = data.monthlyData.map((month) => ({
    month: month.month.substring(0, 3),
    Income: month.income,
    Expenses: month.expenses,
  }));

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
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.8)" />
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
              <Bar dataKey="Income" fill="#667eea" animationDuration={1000} />
              <Bar dataKey="Expenses" fill="#764ba2" animationDuration={1000} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </PageContainer>
  );
}
