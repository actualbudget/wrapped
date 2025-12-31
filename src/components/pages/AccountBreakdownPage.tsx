import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { PageContainer } from "../PageContainer";
import type { WrappedData } from "../../types";
import styles from "./Page.module.css";

interface AccountBreakdownPageProps {
  data: WrappedData;
}

const ACCOUNT_COLORS = [
  "#667eea",
  "#764ba2",
  "#f093fb",
  "#4facfe",
  "#43e97b",
  "#fa709a",
  "#fee140",
  "#30cfd0",
];

export function AccountBreakdownPage({ data }: AccountBreakdownPageProps) {
  const chartData = data.accountBreakdown.map((account) => ({
    name: account.accountName,
    value: account.totalSpending,
    transactionCount: account.transactionCount,
    percentage: account.percentage,
  }));

  return (
    <PageContainer id="account-breakdown-page">
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
          Account Breakdown
        </motion.h2>
        <motion.p
          className={styles.sectionSubtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Spending distribution across your accounts
        </motion.p>

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
                  <Cell
                    key={`cell-${index}`}
                    fill={ACCOUNT_COLORS[index % ACCOUNT_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.9)",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                }}
                formatter={(value: number | undefined, _name: string | undefined, props: any) => [
                  `$${Math.round(value ?? 0).toLocaleString("en-US")}`,
                  `(${props.payload.transactionCount} transactions)`,
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <motion.div
          className={styles.statsGrid}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {data.accountBreakdown.slice(0, 3).map((account) => (
            <div key={account.accountId} className={styles.statCard}>
              <div className={styles.statValue}>
                ${account.totalSpending.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </div>
              <div className={styles.statLabel}>{account.accountName}</div>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "rgba(255, 255, 255, 0.6)",
                  marginTop: "0.5rem",
                }}
              >
                {account.transactionCount} transactions ({account.percentage.toFixed(1)}%)
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
