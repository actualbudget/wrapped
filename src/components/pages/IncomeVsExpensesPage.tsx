import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { PageContainer } from "../PageContainer";
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";
import type { WrappedData } from "../../types";
import styles from "./Page.module.css";

interface IncomeVsExpensesPageProps {
  data: WrappedData;
}

const COLORS = ["#667eea", "#764ba2"];

export function IncomeVsExpensesPage({ data }: IncomeVsExpensesPageProps) {
  const animatedIncome = useAnimatedNumber(data.totalIncome, 1500, 0);
  const animatedExpenses = useAnimatedNumber(data.totalExpenses, 1500, 0);
  const animatedSavings = useAnimatedNumber(data.netSavings, 1500, 0);

  const chartData = [
    { name: "Income", value: data.totalIncome },
    { name: "Expenses", value: data.totalExpenses },
  ];

  return (
    <PageContainer id="income-expenses-page">
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
          Income vs Expenses
        </motion.h2>

        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
              >
                {chartData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <motion.div
          className={styles.statsGrid}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              ${animatedIncome.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </div>
            <div className={styles.statLabel}>Total Income</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              ${animatedExpenses.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </div>
            <div className={styles.statLabel}>Total Expenses</div>
          </div>
          <div className={styles.statCard}>
            <div
              className={`${styles.statValue} ${animatedSavings >= 0 ? styles.positive : styles.negative}`}
            >
              ${Math.abs(animatedSavings).toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </div>
            <div className={styles.statLabel}>
              {animatedSavings >= 0 ? "Net Savings" : "Net Loss"}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
