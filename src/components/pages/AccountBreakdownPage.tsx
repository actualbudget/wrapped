import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, TooltipProps } from "recharts";

import type { WrappedData } from "../../types";

import { PageContainer } from "../PageContainer";
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

const CustomTooltip = ({
  active,
  payload,
}: TooltipProps<number, string> & {
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    payload?: { transactionCount?: number; percentage?: number };
  }>;
}) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0];
  const transactionCount = data.payload?.transactionCount;
  const percentage = data.payload?.percentage;

  return (
    <div
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        border: "none",
        borderRadius: "8px",
        padding: "12px",
        color: "white",
      }}
    >
      <p style={{ margin: "0 0 8px 0", color: "#ffffff", fontWeight: "bold" }}>
        {data.name || "Account"}
      </p>
      <p style={{ margin: "4px 0", color: data.color || "#ffffff" }}>
        <span style={{ marginRight: "8px" }}>Spending:</span>$
        {Math.round(data.value ?? 0).toLocaleString("en-US")}
      </p>
      {transactionCount !== undefined && (
        <p style={{ margin: "4px 0", color: "rgba(255, 255, 255, 0.8)" }}>
          {transactionCount} transactions
          {percentage !== undefined && ` (${percentage.toFixed(1)}%)`}
        </p>
      )}
    </div>
  );
};

export function AccountBreakdownPage({ data }: AccountBreakdownPageProps) {
  const [hiddenAccounts, setHiddenAccounts] = useState<Set<string>>(new Set());

  // Create full chart data with account IDs for tracking
  const fullChartData = useMemo(() => {
    return data.accountBreakdown.map((account) => ({
      accountId: account.accountId,
      name: account.accountName,
      value: account.totalSpending,
      transactionCount: account.transactionCount,
      percentage: account.percentage,
    }));
  }, [data.accountBreakdown]);

  // Filter out hidden accounts for the pie chart
  const chartData = useMemo(() => {
    return fullChartData.filter((account) => !hiddenAccounts.has(account.accountId));
  }, [fullChartData, hiddenAccounts]);

  const handleAccountClick = (accountId: string) => {
    setHiddenAccounts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

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

        <div className={styles.chartContainer} style={{ overflow: "hidden" }}>
          <ResponsiveContainer width="100%" height={450}>
            <PieChart
              key={Array.from(hiddenAccounts).sort().join(",")}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={false}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
              >
                {chartData.map((entry) => {
                  // Find the original index in fullChartData to maintain color consistency
                  const originalIndex = fullChartData.findIndex(
                    (a) => a.accountId === entry.accountId,
                  );
                  return (
                    <Cell
                      key={`cell-${entry.accountId}`}
                      fill={ACCOUNT_COLORS[originalIndex % ACCOUNT_COLORS.length]}
                    />
                  );
                })}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: "10px" }}
                content={() => (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    {fullChartData.map((account, index) => {
                      const isHidden = hiddenAccounts.has(account.accountId);
                      const color = ACCOUNT_COLORS[index % ACCOUNT_COLORS.length];
                      return (
                        <button
                          key={`legend-${account.accountId}`}
                          type="button"
                          onClick={() => handleAccountClick(account.accountId)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                            opacity: isHidden ? 0.3 : 1,
                            padding: "2px 4px",
                            borderRadius: "4px",
                            transition: "opacity 0.2s",
                            border: "none",
                            background: "transparent",
                            font: "inherit",
                            color: "inherit",
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
                              backgroundColor: color,
                              marginRight: "3px",
                              opacity: isHidden ? 0.3 : 1,
                            }}
                          />
                          <span style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "0.9rem" }}>
                            {account.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              />
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
