import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

import type { WrappedData } from '../../types';

import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import { PageContainer } from '../PageContainer';
import styles from './Page.module.css';

interface SavingsRatePageProps {
  data: WrappedData;
}

const SAVINGS_COLORS = ['#43e97b', '#764ba2'];

export function SavingsRatePage({ data }: SavingsRatePageProps) {
  const animatedRate = useAnimatedNumber(data.savingsRate, 1500, 1);
  const savingsAmount = Math.max(0, data.netSavings);
  const expensesAmount = data.totalExpenses;

  const chartData = [
    { name: 'Saved', value: savingsAmount },
    { name: 'Spent', value: expensesAmount },
  ];

  return (
    <PageContainer id="savings-rate-page">
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
          Savings Rate
        </motion.h2>
        <motion.p
          className={styles.sectionSubtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {data.netSavings >= 0
            ? 'Great job saving this year!'
            : "Let's work on improving this next year"}
        </motion.p>

        <motion.div
          className={styles.percentage}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
        >
          {animatedRate >= 0 ? '+' : ''}
          {animatedRate.toFixed(1)}%
        </motion.div>

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
                    fill={SAVINGS_COLORS[index % SAVINGS_COLORS.length]}
                  />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <motion.div
          className={styles.statsGrid}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              ${savingsAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className={styles.statLabel}>Total Saved</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              ${expensesAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className={styles.statLabel}>Total Spent</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              ${data.totalIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className={styles.statLabel}>Total Income</div>
          </div>
        </motion.div>

        <motion.p
          style={{
            marginTop: '2rem',
            fontSize: '1rem',
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Formula: (Income - Expenses) / Income × 100
        </motion.p>
      </motion.div>
    </PageContainer>
  );
}
