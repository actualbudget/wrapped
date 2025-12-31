import { motion } from "framer-motion";
import { PageContainer } from "../PageContainer";
import { ClickableBarChart } from "../charts/ClickableBarChart";
import type { WrappedData } from "../../types";
import styles from "./Page.module.css";

interface TopCategoriesPageProps {
  data: WrappedData;
}

const CATEGORY_COLORS = [
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

export function TopCategoriesPage({ data }: TopCategoriesPageProps) {
  const chartData = data.topCategories.map((cat) => ({
    id: cat.categoryId,
    name:
      cat.categoryName.length > 20 ? cat.categoryName.substring(0, 20) + "..." : cat.categoryName,
    fullName: cat.categoryName,
    amount: cat.amount,
    percentage: cat.percentage.toFixed(1),
  }));

  return (
    <PageContainer id="top-categories-page">
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
          Top Spending Categories
        </motion.h2>
        <motion.p
          className={styles.sectionSubtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Where your money went this year
        </motion.p>

        <div className={styles.chartContainer}>
          <ClickableBarChart
            data={chartData}
            colors={CATEGORY_COLORS}
            height={600}
            margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
          />
        </div>

        <motion.div
          className={styles.statsGrid}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {data.topCategories.slice(0, 3).map((cat) => (
            <div key={cat.categoryId} className={styles.statCard}>
              <div className={styles.statValue}>
                ${cat.amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </div>
              <div className={styles.statLabel}>{cat.categoryName}</div>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "rgba(255, 255, 255, 0.6)",
                  marginTop: "0.5rem",
                }}
              >
                {cat.percentage.toFixed(1)}% of expenses
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
