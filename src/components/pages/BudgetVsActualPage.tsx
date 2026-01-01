import { motion } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';

import type { WrappedData } from '../../types';

import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import { PageContainer } from '../PageContainer';
import styles from './Page.module.css';

interface BudgetVsActualPageProps {
  data: WrappedData;
}

export function BudgetVsActualPage({ data }: BudgetVsActualPageProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Check if budget data is available
  if (!data.budgetComparison || data.budgetComparison.categoryBudgets.length === 0) {
    return (
      <PageContainer id="budget-vs-actual-page">
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
            Budget vs Actual
          </motion.h2>
          <motion.p
            className={styles.sectionSubtitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            No budget data available for comparison
          </motion.p>
          <motion.p
            style={{
              marginTop: '2rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '1rem',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            To see budget comparisons, make sure your Actual Budget export includes budgeted
            amounts.
          </motion.p>
        </motion.div>
      </PageContainer>
    );
  }

  const budgetComparison = data.budgetComparison;

  // Group categories by category group and sort alphabetically within each group
  const groupedCategories = useMemo(() => {
    const groups = new Map<string, typeof budgetComparison.categoryBudgets>();

    // Group all categories by their group (undefined group goes to "Other")
    budgetComparison.categoryBudgets.forEach(cat => {
      const groupName = cat.categoryGroup || 'Other';
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName)!.push(cat);
    });

    // Sort categories alphabetically within each group, but put income categories last
    groups.forEach(categories => {
      categories.sort((a, b) => {
        const aIsIncome = a.categoryName.toLowerCase().includes('income');
        const bIsIncome = b.categoryName.toLowerCase().includes('income');

        // Income categories go last
        if (aIsIncome && !bIsIncome) return 1;
        if (!aIsIncome && bIsIncome) return -1;

        // Otherwise sort alphabetically
        return a.categoryName.localeCompare(b.categoryName);
      });
    });

    // Convert to array of [groupName, categories] and sort groups by sort_order, but put income groups last
    const groupSortOrder = budgetComparison.groupSortOrder || new Map<string, number>();
    return Array.from(groups.entries()).sort((a, b) => {
      const [groupA, groupB] = [a[0], b[0]];
      const aIsIncome = groupA.toLowerCase().includes('income');
      const bIsIncome = groupB.toLowerCase().includes('income');

      // Income groups go last
      if (aIsIncome && !bIsIncome) return 1;
      if (!aIsIncome && bIsIncome) return -1;

      const sortOrderA = groupSortOrder.get(groupA);
      const sortOrderB = groupSortOrder.get(groupB);

      // If both have sort orders, sort by them
      if (sortOrderA !== undefined && sortOrderB !== undefined) {
        return sortOrderA - sortOrderB;
      }
      // If only A has sort order, A comes first
      if (sortOrderA !== undefined) return -1;
      // If only B has sort order, B comes first
      if (sortOrderB !== undefined) return 1;
      // If neither has sort order, sort alphabetically
      return groupA.localeCompare(groupB);
    });
  }, [budgetComparison.categoryBudgets, budgetComparison.groupSortOrder]);

  // Flatten all categories for selection (maintain order: group order, then alphabetical within group)
  const allCategories = useMemo(() => {
    return groupedCategories.flatMap(([, categories]) => categories);
  }, [groupedCategories]);

  // Set default selected category on first render
  useEffect(() => {
    if (!selectedCategoryId && allCategories.length > 0) {
      setSelectedCategoryId(allCategories[0].categoryId);
    }
  }, [allCategories, selectedCategoryId]);

  // Get selected category by ID or default to first
  const selectedCategory = selectedCategoryId
    ? allCategories.find(cat => cat.categoryId === selectedCategoryId) || allCategories[0] || null
    : allCategories[0] || null;

  // Prepare chart data for selected category
  const chartData = useMemo(() => {
    if (!selectedCategory) return [];

    return selectedCategory.monthlyBudgets.map(budget => ({
      month: budget.month.substring(0, 3),
      Budgeted: budget.budgetedAmount,
      'Carry Forward': budget.carryForward,
      'Effective Budget': budget.effectiveBudget,
      Actual: budget.actualAmount,
      Variance: budget.variance,
    }));
  }, [selectedCategory]);

  // Overall statistics
  const animatedBudgeted = useAnimatedNumber(budgetComparison.overallBudgeted, 1500, 2);
  const animatedActual = useAnimatedNumber(budgetComparison.overallActual, 1500, 2);
  const animatedVariance = useAnimatedNumber(Math.abs(budgetComparison.overallVariance), 1500, 2);

  const categoriesOverBudget = budgetComparison.categoryBudgets.filter(
    cat => cat.totalVariance > 0,
  ).length;
  const categoriesUnderBudget = budgetComparison.categoryBudgets.filter(
    cat => cat.totalVariance < 0,
  ).length;

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string> & {
    payload?: Array<{
      value?: number;
      dataKey?: string;
      name?: string;
      color?: string;
    }>;
    label?: string;
  }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          border: 'none',
          borderRadius: '8px',
          padding: '12px',
          color: '#ffffff',
        }}
      >
        <p style={{ margin: '0 0 8px 0', color: '#ffffff', fontWeight: 'bold' }}>{label}</p>
        {payload.map((entry, index) => {
          if (!entry.value && entry.value !== 0) return null;
          // Skip "Carry Forward" bar as it's shown separately
          if (entry.dataKey === 'Carry Forward') return null;

          const isVariance = entry.dataKey === 'Variance';
          const varianceValue =
            isVariance && selectedCategory
              ? selectedCategory.monthlyBudgets.find(m => m.month.substring(0, 3) === label)
                  ?.variance || 0
              : entry.value || 0;

          return (
            <p
              key={entry.dataKey || entry.name || index}
              style={{
                margin: '4px 0',
                color: isVariance
                  ? varianceValue >= 0
                    ? '#fa709a'
                    : '#43e97b'
                  : entry.color || '#ffffff',
              }}
            >
              <span style={{ marginRight: '8px' }}>{entry.name}:</span>$
              {Math.round(Math.abs(varianceValue)).toLocaleString('en-US', {
                maximumFractionDigits: 0,
              })}
              {isVariance && (
                <span style={{ marginLeft: '4px', fontSize: '0.9em' }}>
                  ({varianceValue >= 0 ? 'over' : 'under'} budget)
                </span>
              )}
            </p>
          );
        })}
        {/* Show carry forward info if available */}
        {selectedCategory &&
          (() => {
            const monthData = selectedCategory.monthlyBudgets.find(
              m => m.month.substring(0, 3) === label,
            );
            const carryForward = monthData?.carryForward || 0;
            if (carryForward > 0) {
              return (
                <p
                  style={{
                    margin: '8px 0 0 0',
                    color: '#4facfe',
                    fontSize: '0.85rem',
                    fontStyle: 'italic',
                    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                    paddingTop: '8px',
                  }}
                >
                  Carry Forward: $
                  {carryForward.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </p>
              );
            }
            return null;
          })()}
      </div>
    );
  };

  return (
    <PageContainer id="budget-vs-actual-page">
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
          Budget vs Actual
        </motion.h2>
        <motion.p
          className={styles.sectionSubtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          How your spending compared to your budget
        </motion.p>

        {/* Overall Summary Stats */}
        <motion.div
          className={styles.statsGrid}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div
            className={styles.statCard}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className={styles.statValue}>
              ${animatedBudgeted.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className={styles.statLabel}>Total Budgeted</div>
          </motion.div>

          <motion.div
            className={styles.statCard}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className={styles.statValue}>
              ${animatedActual.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className={styles.statLabel}>Total Actual</div>
          </motion.div>

          <motion.div
            className={styles.statCard}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div
              className={styles.statValue}
              style={{
                color: budgetComparison.overallVariance >= 0 ? '#fa709a' : '#43e97b',
              }}
            >
              ${animatedVariance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className={styles.statLabel}>
              {budgetComparison.overallVariance >= 0 ? 'Over Budget' : 'Under Budget'}
            </div>
            <div
              style={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginTop: '0.5rem',
              }}
            >
              {budgetComparison.overallVariancePercentage.toFixed(1)}% variance
            </div>
          </motion.div>
        </motion.div>

        {/* Category Selection - Single Select Dropdown */}
        {allCategories.length > 1 && (
          <motion.div
            style={{
              marginTop: '2rem',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'center',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <select
              value={selectedCategoryId || ''}
              onChange={e => setSelectedCategoryId(e.target.value)}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                minWidth: '300px',
                maxWidth: '500px',
                width: '100%',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              {groupedCategories.map(([groupName, categories]) => (
                <optgroup key={groupName} label={groupName}>
                  {categories.map(cat => (
                    <option key={cat.categoryId} value={cat.categoryId}>
                      {cat.categoryName}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </motion.div>
        )}

        {/* Chart for Selected Category */}
        {selectedCategory && (
          <motion.div
            className={styles.chartContainer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <div
              style={{
                textAlign: 'center',
                marginBottom: '1rem',
                fontSize: '1.1rem',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: '500',
              }}
            >
              {selectedCategory.categoryName}
            </div>
            <ResponsiveContainer width="100%" height={500}>
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.8)" />
                <YAxis
                  stroke="rgba(255, 255, 255, 0.8)"
                  tickFormatter={value => `$${Math.round(value).toLocaleString('en-US')}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  content={({ payload }) => (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: '16px',
                      }}
                    >
                      {payload?.map((entry, index) => (
                        <div
                          key={`legend-${index}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '4px 8px',
                          }}
                        >
                          <div
                            style={{
                              width: '12px',
                              height: '12px',
                              backgroundColor: entry.color as string,
                              marginRight: '6px',
                            }}
                          />
                          <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
                            {entry.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                />
                <Bar dataKey="Budgeted" fill="#667eea" opacity={0.5} animationDuration={1000} />
                <Bar
                  dataKey="Carry Forward"
                  fill="#4facfe"
                  opacity={0.4}
                  animationDuration={1000}
                />
                <Bar dataKey="Actual" fill="#764ba2" opacity={0.8} animationDuration={1000} />
                <Line
                  type="monotone"
                  dataKey="Effective Budget"
                  stroke="#43e97b"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  animationDuration={1000}
                  strokeDasharray="3 3"
                />
                <Line
                  type="monotone"
                  dataKey="Variance"
                  stroke="#fa709a"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  animationDuration={1000}
                  strokeDasharray="5 5"
                />
              </ComposedChart>
            </ResponsiveContainer>
            <div
              style={{
                marginTop: '1rem',
                display: 'flex',
                justifyContent: 'center',
                gap: '2rem',
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.7)',
              }}
            >
              <div>
                Total Budgeted: $
                {selectedCategory.totalBudgeted.toLocaleString('en-US', {
                  maximumFractionDigits: 0,
                })}
              </div>
              <div>
                Total Actual: $
                {selectedCategory.totalActual.toLocaleString('en-US', {
                  maximumFractionDigits: 0,
                })}
              </div>
              <div
                style={{
                  color: selectedCategory.totalVariance >= 0 ? '#fa709a' : '#43e97b',
                }}
              >
                Variance: $
                {Math.abs(selectedCategory.totalVariance).toLocaleString('en-US', {
                  maximumFractionDigits: 0,
                })}{' '}
                ({selectedCategory.totalVariancePercentage.toFixed(1)}%)
              </div>
            </div>
          </motion.div>
        )}

        {/* Category Summary */}
        <motion.div
          className={styles.statsGrid}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          style={{ marginTop: '2rem' }}
        >
          <motion.div
            className={styles.statCard}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.1 }}
          >
            <div className={styles.largeNumber} style={{ fontSize: 'clamp(1.8rem, 5vw, 3.5rem)' }}>
              {categoriesOverBudget}
            </div>
            <div className={styles.statLabel}>Categories Over Budget</div>
          </motion.div>

          <motion.div
            className={styles.statCard}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.2 }}
          >
            <div className={styles.largeNumber} style={{ fontSize: 'clamp(1.8rem, 5vw, 3.5rem)' }}>
              {categoriesUnderBudget}
            </div>
            <div className={styles.statLabel}>Categories Under Budget</div>
          </motion.div>

          <motion.div
            className={styles.statCard}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.3 }}
          >
            <div className={styles.largeNumber} style={{ fontSize: 'clamp(1.8rem, 5vw, 3.5rem)' }}>
              {budgetComparison.categoryBudgets.length}
            </div>
            <div className={styles.statLabel}>Total Categories</div>
          </motion.div>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
