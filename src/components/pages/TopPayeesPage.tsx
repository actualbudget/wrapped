import { motion } from "framer-motion";
import { useState } from "react";
import { PageContainer } from "../PageContainer";
import { ClickableBarChart } from "../charts/ClickableBarChart";
import type { WrappedData } from "../../types";
import styles from "./Page.module.css";

interface TopPayeesPageProps {
  data: WrappedData;
}

const PAYEE_COLORS = [
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

export function TopPayeesPage({ data }: TopPayeesPageProps) {
  const [viewMode, setViewMode] = useState<"amount" | "count">("amount");

  // Use allPayees if available, otherwise fall back to topPayees
  // Note: Transfer transactions are already filtered out in dataTransform
  const availablePayees = data.allPayees || data.topPayees;
  const sortedPayees = [...availablePayees]
    .sort((a, b) => {
      if (viewMode === "amount") {
        return b.amount - a.amount;
      } else {
        return b.transactionCount - a.transactionCount;
      }
    })
    .slice(0, 10); // Always show top 10

  const chartData = sortedPayees.map((payee) => {
    // Ensure payee name is never blank
    const payeeName = payee.payee && payee.payee.trim() !== "" ? payee.payee : "Unknown";
    return {
      id: payeeName, // Use payee name as unique identifier
      name: payeeName.length > 20 ? payeeName.substring(0, 20) + "..." : payeeName,
      fullName: payeeName,
      amount: payee.amount,
      transactions: payee.transactionCount,
    };
  });

  return (
    <PageContainer id="top-payees-page">
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
          Top Payees
        </motion.h2>
        <motion.p
          className={styles.sectionSubtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Who received your money this year
        </motion.p>

        {/* View mode toggle */}
        <motion.div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "20px",
            alignItems: "center",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={() => setViewMode("amount")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "2px solid",
              borderColor: viewMode === "amount" ? "#667eea" : "rgba(255, 255, 255, 0.3)",
              backgroundColor: viewMode === "amount" ? "rgba(102, 126, 234, 0.2)" : "transparent",
              color: "white",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: viewMode === "amount" ? "bold" : "normal",
              transition: "all 0.2s",
            }}
          >
            Amount
          </button>
          <button
            onClick={() => setViewMode("count")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "2px solid",
              borderColor: viewMode === "count" ? "#667eea" : "rgba(255, 255, 255, 0.3)",
              backgroundColor: viewMode === "count" ? "rgba(102, 126, 234, 0.2)" : "transparent",
              color: "white",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: viewMode === "count" ? "bold" : "normal",
              transition: "all 0.2s",
            }}
          >
            Transaction Count
          </button>
        </motion.div>

        <div className={styles.chartContainer}>
          <ClickableBarChart
            data={chartData.map((item) => ({
              ...item,
              amount: viewMode === "amount" ? item.amount : item.transactions,
              originalAmount: viewMode === "amount" ? item.amount : item.transactions,
            }))}
            colors={PAYEE_COLORS}
            height={600}
            margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
            tooltipFormatter={(item, displayValue) => (
              <>
                <p style={{ margin: "0 0 8px 0", color: "#ffffff" }}>
                  {item.transactions as number} transaction
                  {(item.transactions as number) !== 1 ? "s" : ""}
                </p>
                {viewMode === "amount" && (
                  <p style={{ margin: 0, color: "#ffffff" }}>
                    Amount: $
                    {typeof displayValue === "number"
                      ? Math.round(displayValue).toLocaleString("en-US")
                      : "0"}
                  </p>
                )}
              </>
            )}
          />
        </div>

        <motion.div
          className={styles.statsGrid}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {sortedPayees.slice(0, 3).map((payee) => {
            const payeeName = payee.payee && payee.payee.trim() !== "" ? payee.payee : "Unknown";
            return (
              <div key={payeeName} className={styles.statCard}>
                <div className={styles.statValue}>
                  {viewMode === "amount" ? (
                    <>${payee.amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}</>
                  ) : (
                    <>{payee.transactionCount}</>
                  )}
                </div>
                <div className={styles.statLabel}>{payeeName}</div>
                <div
                  style={{
                    fontSize: "0.9rem",
                    color: "rgba(255, 255, 255, 0.6)",
                    marginTop: "0.5rem",
                  }}
                >
                  {viewMode === "amount" ? (
                    <>
                      {payee.transactionCount} transaction{payee.transactionCount !== 1 ? "s" : ""}
                    </>
                  ) : (
                    <>${payee.amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}</>
                  )}
                </div>
              </div>
            );
          })}
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
