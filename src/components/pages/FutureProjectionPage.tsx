import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
} from 'recharts';

import type { WrappedData } from '../../types';

import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import { PageContainer } from '../PageContainer';
import styles from './Page.module.css';

interface FutureProjectionPageProps {
  data: WrappedData;
}

export function FutureProjectionPage({ data }: FutureProjectionPageProps) {
  const animatedProjectedSavings = useAnimatedNumber(
    data.futureProjection.projectedYearEndSavings,
    1500,
    0,
  );

  // Get December 2025's value for the connecting point
  const december2025Value =
    data.futureProjection.actual2025Data.length > 0
      ? data.futureProjection.actual2025Data[data.futureProjection.actual2025Data.length - 1]
          .cumulativeSavings
      : 0;

  // Prepare 2025 actual data (first 11 months, only actual values)
  const actual2025Data = data.futureProjection.actual2025Data.slice(0, -1).map(item => ({
    month: item.month.substring(0, 3),
    fullMonth: item.month,
    '2025 Actual': item.cumulativeSavings,
    '2026 Projected': null as number | null,
  }));

  // Add December 2025 as a connecting point with both values equal
  const december2025Point = {
    month: 'Dec',
    fullMonth: 'December',
    '2025 Actual': december2025Value,
    '2026 Projected': december2025Value,
  };

  // Prepare 2026 projected data (all 12 months starting from January 2026)
  // The data transformation already ensures January 2026 starts at December 2025's value
  const projected2026Data = data.futureProjection.monthlyProjections.map(projection => ({
    month: projection.month.substring(0, 3),
    fullMonth: projection.month,
    '2025 Actual': null as number | null,
    '2026 Projected': projection.cumulativeSavings,
  }));

  // Combine both datasets with the connecting point
  const chartData = [...actual2025Data, december2025Point, ...projected2026Data];

  // Find milestone points on the chart - map milestones to chart data points
  const milestonePoints = data.savingsMilestones
    .map(milestone => {
      // Find the month when the milestone was reached by checking actual2025Data
      const milestoneDate = new Date(milestone.date);
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const milestoneMonth = monthNames[milestoneDate.getMonth()];

      // Find the corresponding data point in chartData where the milestone was reached
      // Check actual2025Data first, then projected data
      const actualDataPoint = chartData.find(
        point => point.month === milestoneMonth && point['2025 Actual'] !== null,
      );

      if (actualDataPoint) {
        return {
          ...milestone,
          month: milestoneMonth,
          value: actualDataPoint['2025 Actual'] ?? 0,
          dataPoint: actualDataPoint,
        };
      }

      // If not found in actual data, check projected data
      const projectedDataPoint = chartData.find(
        point => point.month === milestoneMonth && point['2026 Projected'] !== null,
      );

      if (projectedDataPoint) {
        return {
          ...milestone,
          month: milestoneMonth,
          value: projectedDataPoint['2026 Projected'] ?? 0,
          dataPoint: projectedDataPoint,
        };
      }

      return null;
    })
    .filter((point): point is NonNullable<typeof point> => point !== null);

  return (
    <PageContainer id="future-projection-page">
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
          Future Projection
        </motion.h2>
        <motion.p
          className={styles.sectionSubtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          If you continue at this pace, here&apos;s what the next year looks like
        </motion.p>

        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={chartData} margin={{ top: 20, right: 80, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.8)" />
              <YAxis
                stroke="rgba(255, 255, 255, 0.8)"
                tickFormatter={value =>
                  `${data.currencySymbol}${Math.round(value).toLocaleString('en-US')}`
                }
              />
              <Tooltip
                content={() => null}
                cursor={{ stroke: 'rgba(255, 255, 255, 0.3)', strokeWidth: 1 }}
              />
              <ReferenceLine y={0} stroke="rgba(255, 255, 255, 0.3)" strokeDasharray="3 3" />
              {/* Add reference lines and labels for savings milestones */}
              {milestonePoints.map(milestone => (
                <ReferenceLine
                  key={milestone.milestone}
                  y={milestone.amount}
                  stroke="rgba(255, 215, 0, 0.5)"
                  strokeDasharray="2 2"
                  strokeWidth={2}
                >
                  <Label
                    value={milestone.milestone}
                    position="right"
                    fill="rgba(255, 215, 0, 0.9)"
                    style={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                </ReferenceLine>
              ))}
              <Line
                type="monotone"
                dataKey="2025 Actual"
                stroke="#43e97b"
                strokeWidth={3}
                dot={(props: {
                  cx?: number;
                  cy?: number;
                  payload?: { month?: string; '2025 Actual'?: number };
                }) => {
                  // Add custom dots for milestone points
                  if (!props.cx || !props.cy) return null;
                  const isMilestone = milestonePoints.some(
                    mp =>
                      mp.dataPoint.month === props.payload?.month &&
                      Math.abs((props.payload?.['2025 Actual'] ?? 0) - mp.amount) < 500,
                  );
                  if (isMilestone) {
                    return (
                      <g>
                        <circle
                          cx={props.cx}
                          cy={props.cy}
                          r={6}
                          fill="#ffd700"
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      </g>
                    );
                  }
                  return null;
                }}
                activeDot={false}
                connectNulls={false}
                animationDuration={1000}
              />
              <Line
                type="monotone"
                dataKey="2026 Projected"
                stroke="#43e97b"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={(props: {
                  cx?: number;
                  cy?: number;
                  payload?: { month?: string; '2026 Projected'?: number };
                }) => {
                  // Add custom dots for milestone points on projected line
                  if (!props.cx || !props.cy) return null;
                  const isMilestone = milestonePoints.some(
                    mp =>
                      mp.dataPoint.month === props.payload?.month &&
                      Math.abs((props.payload?.['2026 Projected'] ?? 0) - mp.amount) < 500,
                  );
                  if (isMilestone) {
                    return (
                      <g>
                        <circle
                          cx={props.cx}
                          cy={props.cy}
                          r={6}
                          fill="#ffd700"
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      </g>
                    );
                  }
                  return null;
                }}
                activeDot={false}
                connectNulls={false}
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
            <div
              className={`${styles.statValue} ${animatedProjectedSavings >= 0 ? styles.positive : styles.negative}`}
            >
              {data.currencySymbol}
              {Math.abs(animatedProjectedSavings).toLocaleString('en-US', {
                maximumFractionDigits: 0,
              })}
            </div>
            <div className={styles.statLabel}>Projected Savings (Next Year End)</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {data.currencySymbol}
              {data.futureProjection.dailyNetSavings.toFixed(2)}
            </div>
            <div className={styles.statLabel}>Daily Net Savings</div>
            <div
              style={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginTop: '0.5rem',
              }}
            >
              {data.currencySymbol}
              {data.futureProjection.dailyAverageIncome.toFixed(2)} income - {data.currencySymbol}
              {data.futureProjection.dailyAverageExpenses.toFixed(2)} expenses
            </div>
          </div>
          {data.futureProjection.monthsUntilZero !== null ? (
            <div className={styles.statCard}>
              <div className={styles.statValue} style={{ color: '#f87171' }}>
                {data.futureProjection.monthsUntilZero}
              </div>
              <div className={styles.statLabel}>Months Until Zero Savings</div>
            </div>
          ) : (
            <div className={styles.statCard}>
              <div className={styles.statValue} style={{ color: '#4ade80' }}>
                ∞
              </div>
              <div className={styles.statLabel}>Savings Will Continue Growing</div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
