import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import type { WrappedData } from '../../types';

import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import { PageContainer } from '../PageContainer';
import styles from './Page.module.css';

interface SpendingVelocityPageProps {
  data: WrappedData;
}

export function SpendingVelocityPage({ data }: SpendingVelocityPageProps) {
  const animatedDailyAverage = useAnimatedNumber(data.spendingVelocity.dailyAverage, 1500, 2);

  const chartData = data.spendingVelocity.weeklyData.map(week => ({
    week: week.week.replace('Week ', 'W'),
    averagePerDay: week.averagePerDay,
  }));

  return (
    <PageContainer id="spending-velocity-page">
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
          Spending Velocity
        </motion.h2>
        <motion.p
          className={styles.sectionSubtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Your daily spending pace throughout the year
        </motion.p>

        <motion.div
          className={styles.largeNumber}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
        >
          {data.currencySymbol}
          {animatedDailyAverage.toFixed(2)}/day
        </motion.div>

        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="week" stroke="rgba(255, 255, 255, 0.8)" />
              <YAxis
                stroke="rgba(255, 255, 255, 0.8)"
                tickFormatter={value =>
                  `${data.currencySymbol}${Math.round(value).toLocaleString('en-US')}`
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                }}
                formatter={(value: number | undefined) => [
                  `${data.currencySymbol}${Math.round((value ?? 0) * 100) / 100}`,
                  'Avg/Day',
                ]}
              />
              <Line
                type="monotone"
                dataKey="averagePerDay"
                stroke="#667eea"
                strokeWidth={3}
                dot={{ r: 4 }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <motion.div
          className={styles.statsGrid}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className={styles.statCard}>
            <div className={styles.statValue}>{data.spendingVelocity.fastestPeriod.period}</div>
            <div className={styles.statLabel}>Fastest Spending Period</div>
            <div
              style={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginTop: '0.5rem',
              }}
            >
              {data.currencySymbol}
              {data.spendingVelocity.fastestPeriod.averagePerDay.toFixed(2)}/day
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{data.spendingVelocity.slowestPeriod.period}</div>
            <div className={styles.statLabel}>Slowest Spending Period</div>
            <div
              style={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginTop: '0.5rem',
              }}
            >
              {data.currencySymbol}
              {data.spendingVelocity.slowestPeriod.averagePerDay.toFixed(2)}/day
            </div>
          </div>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
