import {
  format,
  parseISO,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  getDay,
  endOfWeek,
  eachWeekOfInterval,
  differenceInDays,
  endOfMonth,
} from 'date-fns';

import type {
  Transaction,
  MonthlyData,
  CategorySpending,
  PayeeSpending,
  CategoryTrend,
  TransactionStats,
  CalendarDay,
  WrappedData,
  Account,
  SpendingVelocity,
  DayOfWeekSpending,
  AccountBreakdown,
  SpendingStreaks,
  TransactionSizeDistribution,
  QuarterlyData,
  CategoryGrowth,
  SavingsMilestone,
  FutureProjection,
  BudgetComparisonData,
  CategoryBudget,
} from '../types';

import { integerToAmount } from '../services/fileApi';
import { DataTransformError, getErrorMessage, isDataTransformError } from '../types/errors';
import { SAVINGS_MILESTONE_THRESHOLDS, DEFAULT_YEAR, DAYS_PER_MONTH } from './constants';

// Use DEFAULT_YEAR constant instead of hardcoded value
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Calculate budget comparison data
 */
function calculateBudgetComparison(
  expenseTransactions: Transaction[],
  _categories: Array<{ id: string; name: string; tombstone?: boolean; group?: string }>,
  budgetData: Array<{ categoryId: string; month: string; budgetedAmount: number }>,
  accountOffbudgetMap: Map<string, boolean>,
  categoryIdToName: Map<string, string>,
  categoryIdToGroup: Map<string, string>,
): BudgetComparisonData | undefined {
  if (!budgetData || budgetData.length === 0) {
    return undefined;
  }

  // Create a map of budget data: categoryId -> month -> budgetedAmount
  const budgetMap = new Map<string, Map<string, number>>();
  budgetData.forEach(budget => {
    if (!budgetMap.has(budget.categoryId)) {
      budgetMap.set(budget.categoryId, new Map());
    }
    const categoryBudgets = budgetMap.get(budget.categoryId)!;
    categoryBudgets.set(budget.month, budget.budgetedAmount);
  });

  // Calculate actual spending per category per month
  const actualSpendingMap = new Map<string, Map<string, number>>(); // categoryId -> month -> actualAmount

  expenseTransactions.forEach(t => {
    const date = parseISO(t.date);
    const monthName = MONTHS[date.getMonth()];
    const isOffBudget = accountOffbudgetMap.get(t.account) || false;

    let categoryId: string;
    if (!t.category || t.category === '') {
      categoryId = isOffBudget ? 'off-budget' : 'uncategorized';
    } else {
      categoryId = t.category;
    }

    if (!actualSpendingMap.has(categoryId)) {
      actualSpendingMap.set(categoryId, new Map());
    }
    const categorySpending = actualSpendingMap.get(categoryId)!;
    const currentAmount = categorySpending.get(monthName) || 0;
    categorySpending.set(monthName, currentAmount + integerToAmount(Math.abs(t.amount)));
  });

  // Get all unique category IDs from both budget and actual spending
  const allCategoryIds = new Set<string>();
  budgetMap.forEach((_, categoryId) => allCategoryIds.add(categoryId));
  actualSpendingMap.forEach((_, categoryId) => allCategoryIds.add(categoryId));

  // Build category budgets
  const categoryBudgets: CategoryBudget[] = Array.from(allCategoryIds).map(categoryId => {
    const categoryName =
      categoryId === 'uncategorized'
        ? 'Uncategorized'
        : categoryId === 'off-budget'
          ? 'Off Budget'
          : categoryIdToName.get(categoryId) || categoryId;

    const categoryGroup = categoryIdToGroup.get(categoryId);

    const budgetMapForCategory = budgetMap.get(categoryId) || new Map();
    const actualMapForCategory = actualSpendingMap.get(categoryId) || new Map();

    // Calculate monthly budgets with carry forward logic
    let carryForwardFromPrevious = 0; // Carry forward from previous month
    const monthlyBudgets = MONTHS.map(monthName => {
      const budgetedAmount = budgetMapForCategory.get(monthName) || 0;
      const actualAmount = actualMapForCategory.get(monthName) || 0;
      const carryForward = carryForwardFromPrevious;
      const effectiveBudget = budgetedAmount + carryForward; // Available to spend this month
      const remaining = effectiveBudget - actualAmount; // What's left after spending
      const variance = actualAmount - effectiveBudget; // Variance against effective budget
      const variancePercentage = effectiveBudget !== 0 ? (variance / effectiveBudget) * 100 : 0;

      // Update carry forward for next month (only positive remaining amounts carry forward)
      carryForwardFromPrevious = remaining > 0 ? remaining : 0;

      return {
        month: monthName,
        budgetedAmount,
        actualAmount,
        carryForward,
        effectiveBudget,
        remaining,
        variance,
        variancePercentage,
      };
    });

    const totalBudgeted = monthlyBudgets.reduce((sum, m) => sum + m.budgetedAmount, 0);
    const totalActual = monthlyBudgets.reduce((sum, m) => sum + m.actualAmount, 0);
    // Total variance should use effective budgets (which include carry forward)
    const totalEffectiveBudget = monthlyBudgets.reduce((sum, m) => sum + m.effectiveBudget, 0);
    const totalVariance = totalActual - totalEffectiveBudget;
    const totalVariancePercentage =
      totalEffectiveBudget !== 0 ? (totalVariance / totalEffectiveBudget) * 100 : 0;

    return {
      categoryId,
      categoryName,
      categoryGroup,
      monthlyBudgets,
      totalBudgeted,
      totalActual,
      totalVariance,
      totalVariancePercentage,
    };
  });

  // Calculate monthly totals (using effective budgets which include carry forward)
  const monthlyTotals = MONTHS.map(monthName => {
    let totalBudgeted = 0;
    let totalEffectiveBudget = 0;
    let totalActual = 0;

    categoryBudgets.forEach(cat => {
      const monthlyData = cat.monthlyBudgets.find(m => m.month === monthName);
      if (monthlyData) {
        totalBudgeted += monthlyData.budgetedAmount;
        totalEffectiveBudget += monthlyData.effectiveBudget;
        totalActual += monthlyData.actualAmount;
      }
    });

    return {
      month: monthName,
      totalBudgeted,
      totalActual,
      variance: totalActual - totalEffectiveBudget, // Variance against effective budget
    };
  });

  // Calculate overall totals (using effective budgets which include carry forward)
  const overallBudgeted = categoryBudgets.reduce((sum, cat) => sum + cat.totalBudgeted, 0);
  const overallActual = categoryBudgets.reduce((sum, cat) => sum + cat.totalActual, 0);
  // Calculate total effective budget across all categories
  const overallEffectiveBudget = categoryBudgets.reduce(
    (sum, cat) => sum + cat.monthlyBudgets.reduce((monthSum, m) => monthSum + m.effectiveBudget, 0),
    0,
  );
  const overallVariance = overallActual - overallEffectiveBudget;
  const overallVariancePercentage =
    overallEffectiveBudget !== 0 ? (overallVariance / overallEffectiveBudget) * 100 : 0;

  return {
    categoryBudgets,
    monthlyTotals,
    overallBudgeted,
    overallActual,
    overallVariance,
    overallVariancePercentage,
    groupSortOrder: undefined, // Will be set by transformToWrappedData
  };
}

export function transformToWrappedData(
  transactions: Transaction[],
  categories: Array<{ id: string; name: string; tombstone?: boolean; group?: string }> = [],
  payees: Array<{ id: string; name: string; tombstone?: boolean; transfer_acct?: string }> = [],
  accounts: Account[] = [],
  year: number = DEFAULT_YEAR,
  budgetData?: Array<{ categoryId: string; month: string; budgetedAmount: number }>,
  groupSortOrders: Map<string, number> = new Map(),
): WrappedData {
  try {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));

    // Create map of account ID to offbudget status
    const accountOffbudgetMap = new Map<string, boolean>();
    // Create map of account ID to account name
    const accountIdToName = new Map<string, string>();
    accounts.forEach(acc => {
      accountOffbudgetMap.set(acc.id, acc.offbudget || false);
      accountIdToName.set(acc.id, acc.name);
    });

    // Build payee mapping early to identify transfers
    const payeeIdToTransferAcct = new Map<string, string>(); // payee_id -> transfer_account_id
    payees.forEach(p => {
      // Store transfer_acct if present (indicates this payee is a transfer)
      if (p.transfer_acct) {
        payeeIdToTransferAcct.set(p.id, p.transfer_acct);
      }
    });

    // Filter transactions for 2025 and exclude transfers
    const yearTransactions = transactions.filter(t => {
      const date = parseISO(t.date);
      if (date < yearStart || date > yearEnd) {
        return false;
      }
      // Exclude transfer transactions (payees with transfer_acct field)
      const isTransfer = t.payee && payeeIdToTransferAcct.has(t.payee);
      return !isTransfer;
    });

    // Calculate income and expenses
    let totalIncome = 0;
    let totalExpenses = 0;

    const incomeTransactions: Transaction[] = [];
    const expenseTransactions: Transaction[] = [];

    yearTransactions.forEach(t => {
      const amount = integerToAmount(Math.abs(t.amount));
      if (t.amount < 0) {
        totalExpenses += amount;
        expenseTransactions.push(t);
      } else {
        totalIncome += amount;
        incomeTransactions.push(t);
      }
    });

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    // Monthly breakdown
    const monthlyData: MonthlyData[] = MONTHS.map((monthName, index) => {
      const monthTransactions = yearTransactions.filter(t => {
        const date = parseISO(t.date);
        return date.getMonth() === index;
      });

      let monthIncome = 0;
      let monthExpenses = 0;

      monthTransactions.forEach(t => {
        const amount = integerToAmount(Math.abs(t.amount));
        if (t.amount < 0) {
          monthExpenses += amount;
        } else {
          monthIncome += amount;
        }
      });

      return {
        month: monthName,
        income: monthIncome,
        expenses: monthExpenses,
        netSavings: monthIncome - monthExpenses,
      };
    });

    // Top categories by spending - create ID to name mapping (including deleted)
    const categoryIdToName = new Map<string, string>();
    const categoryIdToTombstone = new Map<string, boolean>();
    categories.forEach(c => {
      categoryIdToName.set(c.id, c.name);
      categoryIdToTombstone.set(c.id, c.tombstone || false);
    });

    const categoryMap = new Map<string, { name: string; amount: number }>();

    expenseTransactions.forEach(t => {
      // Check if account is off-budget
      const isOffBudget = accountOffbudgetMap.get(t.account) || false;

      // If transaction has no category and account is off-budget, use "off budget"
      // Otherwise, use "uncategorized" for transactions without category
      let categoryId: string;
      let categoryName: string;

      if (!t.category || t.category === '') {
        if (isOffBudget) {
          categoryId = 'off-budget';
          categoryName = 'Off Budget';
        } else {
          categoryId = 'uncategorized';
          categoryName = 'Uncategorized';
        }
      } else {
        categoryId = t.category;
        // Get category name from mapping, or use category_name from transaction, or fallback
        const baseCategoryName =
          categoryIdToName.get(categoryId) || t.category_name || categoryId || 'Uncategorized';
        // Check if category is deleted (from mapping or transaction)
        const isDeleted = categoryIdToTombstone.get(categoryId) || t.category_tombstone || false;
        categoryName = isDeleted ? `deleted: ${baseCategoryName}` : baseCategoryName;
      }

      const amount = integerToAmount(Math.abs(t.amount));

      const existing = categoryMap.get(categoryId) || { name: categoryName, amount: 0 };
      categoryMap.set(categoryId, {
        name: categoryName, // Always use the resolved name
        amount: existing.amount + amount,
      });
    });

    const topCategories: CategorySpending[] = Array.from(categoryMap.entries())
      .map(([id, data]) => ({
        categoryId: id,
        categoryName: data.name,
        amount: data.amount,
        percentage: 0, // Will calculate after sorting
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
      .map(cat => ({
        ...cat,
        percentage: (cat.amount / totalExpenses) * 100,
      }));

    // Category trends
    const categoryTrends: CategoryTrend[] = topCategories.slice(0, 10).map(cat => {
      const monthlyAmounts = MONTHS.map((monthName, monthIndex) => {
        const monthTransactions = expenseTransactions.filter(t => {
          const date = parseISO(t.date);
          const isOffBudget = accountOffbudgetMap.get(t.account) || false;
          let transactionCategoryId: string;
          if (!t.category || t.category === '') {
            transactionCategoryId = isOffBudget ? 'off-budget' : 'uncategorized';
          } else {
            transactionCategoryId = t.category;
          }
          return date.getMonth() === monthIndex && transactionCategoryId === cat.categoryId;
        });

        const amount = monthTransactions.reduce((sum, t) => {
          return sum + integerToAmount(Math.abs(t.amount));
        }, 0);

        return { month: monthName, amount };
      });

      return {
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        monthlyData: monthlyAmounts,
      };
    });

    // Top payees - map payee IDs to names (including deleted)
    // Note: transfer_acct mapping was already built earlier for filtering
    const payeeIdToName = new Map<string, string>();
    const payeeIdToTombstone = new Map<string, boolean>();
    payees.forEach(p => {
      payeeIdToName.set(p.id, p.name);
      payeeIdToTombstone.set(p.id, p.tombstone || false);
    });

    const payeeMap = new Map<string, { amount: number; count: number; name: string }>();

    expenseTransactions.forEach(t => {
      const payeeId = t.payee;
      // Get payee name - prioritize: mapping > transaction payee_name > "Unknown" (never use ID)
      let basePayeeName: string;
      if (payeeId && payeeIdToName.has(payeeId)) {
        // Found in mapping
        basePayeeName = payeeIdToName.get(payeeId)!;
      } else if (t.payee_name && t.payee_name.trim() !== '') {
        // Check if payee_name is "unknown" (case-insensitive)
        if (t.payee_name.trim().toLowerCase() === 'unknown') {
          basePayeeName = 'Unknown';
        } else {
          // Check if payee_name looks like an ID (exists in our mapping but as a key, not a name)
          // If it's the same as payeeId, it's likely an ID, not a name
          const looksLikeId = t.payee_name === payeeId || payeeIdToName.has(t.payee_name);
          if (looksLikeId && payeeIdToName.has(t.payee_name)) {
            // It's actually an ID, look it up
            basePayeeName = payeeIdToName.get(t.payee_name)!;
          } else if (!looksLikeId) {
            // It's a real name, use it
            basePayeeName = t.payee_name;
          } else {
            // It looks like an ID but we can't find it in mapping, use "Unknown"
            basePayeeName = 'Unknown';
          }
        }
      } else {
        // Fallback to "Unknown" instead of showing the ID
        basePayeeName = 'Unknown';
      }

      // Note: Transfer transactions are already filtered out earlier,
      // so we don't need to check for transfers here anymore

      // Check if payee is deleted (from mapping or transaction)
      const isDeleted = (payeeId && payeeIdToTombstone.get(payeeId)) || t.payee_tombstone || false;
      const payeeName = isDeleted ? `deleted: ${basePayeeName}` : basePayeeName;
      const amount = integerToAmount(Math.abs(t.amount));

      // Use payee name as the key for grouping
      const existing = payeeMap.get(payeeName) || { amount: 0, count: 0, name: payeeName };
      payeeMap.set(payeeName, {
        ...existing,
        amount: existing.amount + amount,
        count: existing.count + 1,
      });
    });

    // Create all payees list (sorted by amount for default display)
    const allPayees: PayeeSpending[] = Array.from(payeeMap.values())
      .map(data => ({
        payee: data.name && data.name.trim() !== '' ? data.name : 'Unknown',
        amount: data.amount,
        transactionCount: data.count,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Top 10 by amount (for backward compatibility and default view)
    const topPayees: PayeeSpending[] = allPayees.slice(0, 10);

    // Transaction stats
    const transactionStats: TransactionStats = {
      totalCount: yearTransactions.length,
      averageAmount:
        yearTransactions.length > 0
          ? integerToAmount(
              Math.abs(
                yearTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) /
                  yearTransactions.length,
              ),
            )
          : 0,
      largestTransaction:
        yearTransactions.length > 0
          ? yearTransactions.reduce((max, t) =>
              Math.abs(t.amount) > Math.abs(max.amount) ? t : max,
            )
          : null,
    };

    // Top spending months
    const topMonths = monthlyData
      .map(m => ({ month: m.month, spending: m.expenses }))
      .sort((a, b) => b.spending - a.spending)
      .slice(0, 3);

    // Calendar data
    const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });
    const calendarData: CalendarDay[] = allDays.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayTransactions = yearTransactions.filter(t => t.date === dayStr);

      return {
        date: dayStr,
        count: dayTransactions.length,
        amount: dayTransactions.reduce((sum, t) => sum + integerToAmount(Math.abs(t.amount)), 0),
      };
    });

    // Spending Velocity
    const totalDays = differenceInDays(yearEnd, yearStart) + 1;
    const dailyAverage = totalDays > 0 ? totalExpenses / totalDays : 0;

    // Calculate weekly data for velocity
    const weeks = eachWeekOfInterval({ start: yearStart, end: yearEnd }, { weekStartsOn: 0 });
    const weeklyData = weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
      const weekTransactions = expenseTransactions.filter(t => {
        const date = parseISO(t.date);
        return date >= weekStart && date <= weekEnd;
      });
      const weekSpending = weekTransactions.reduce(
        (sum, t) => sum + integerToAmount(Math.abs(t.amount)),
        0,
      );
      const weekDays = differenceInDays(weekEnd, weekStart) + 1;
      const weekNumber = Math.floor(differenceInDays(weekStart, yearStart) / 7) + 1;
      return {
        week: `Week ${weekNumber}`,
        totalSpending: weekSpending,
        averagePerDay: weekDays > 0 ? weekSpending / weekDays : 0,
      };
    });

    const fastestPeriod = weeklyData.reduce(
      (max, week) => (week.averagePerDay > max.averagePerDay ? week : max),
      weeklyData[0] || { week: 'N/A', totalSpending: 0, averagePerDay: 0 },
    );
    const slowestPeriod = weeklyData.reduce(
      (min, week) => (week.averagePerDay < min.averagePerDay ? week : min),
      weeklyData[0] || { week: 'N/A', totalSpending: 0, averagePerDay: 0 },
    );

    const spendingVelocity: SpendingVelocity = {
      dailyAverage,
      fastestPeriod: {
        period: fastestPeriod.week,
        amount: fastestPeriod.totalSpending,
        averagePerDay: fastestPeriod.averagePerDay,
      },
      slowestPeriod: {
        period: slowestPeriod.week,
        amount: slowestPeriod.totalSpending,
        averagePerDay: slowestPeriod.averagePerDay,
      },
      weeklyData,
    };

    // Day of Week Analysis
    const dayOfWeekMap = new Map<number, { totalSpending: number; transactionCount: number }>();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    expenseTransactions.forEach(t => {
      const date = parseISO(t.date);
      const dayOfWeek = getDay(date);
      const amount = integerToAmount(Math.abs(t.amount));
      const existing = dayOfWeekMap.get(dayOfWeek) || { totalSpending: 0, transactionCount: 0 };
      dayOfWeekMap.set(dayOfWeek, {
        totalSpending: existing.totalSpending + amount,
        transactionCount: existing.transactionCount + 1,
      });
    });

    const dayOfWeekSpending: DayOfWeekSpending[] = dayNames.map((dayName, index) => {
      const data = dayOfWeekMap.get(index) || { totalSpending: 0, transactionCount: 0 };
      return {
        dayOfWeek: index,
        dayName,
        totalSpending: data.totalSpending,
        transactionCount: data.transactionCount,
        averageTransactionSize:
          data.transactionCount > 0 ? data.totalSpending / data.transactionCount : 0,
      };
    });

    // Account Breakdown
    const accountMap = new Map<string, { totalSpending: number; transactionCount: number }>();
    expenseTransactions.forEach(t => {
      const amount = integerToAmount(Math.abs(t.amount));
      const existing = accountMap.get(t.account) || { totalSpending: 0, transactionCount: 0 };
      accountMap.set(t.account, {
        totalSpending: existing.totalSpending + amount,
        transactionCount: existing.transactionCount + 1,
      });
    });

    const accountBreakdown: AccountBreakdown[] = Array.from(accountMap.entries())
      .map(([accountId, data]) => ({
        accountId,
        accountName: accountIdToName.get(accountId) || accountId,
        totalSpending: data.totalSpending,
        transactionCount: data.transactionCount,
        percentage: 0, // Will calculate after sorting
      }))
      .sort((a, b) => b.totalSpending - a.totalSpending)
      .map(acc => ({
        ...acc,
        percentage: totalExpenses > 0 ? (acc.totalSpending / totalExpenses) * 100 : 0,
      }));

    // Spending Streaks
    const daysWithTransactions = new Set<string>();
    expenseTransactions.forEach(t => {
      daysWithTransactions.add(t.date);
    });

    let longestSpendingStreak = { days: 0, startDate: '', endDate: '' };
    let longestNoSpendingStreak = { days: 0, startDate: '', endDate: '' };
    let currentSpendingStreak = 0;
    let currentNoSpendingStreak = 0;
    let currentSpendingStart = '';
    let currentNoSpendingStart = '';

    allDays.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const hasTransaction = daysWithTransactions.has(dayStr);

      if (hasTransaction) {
        if (currentSpendingStreak === 0) {
          currentSpendingStart = dayStr;
        }
        currentSpendingStreak++;
        currentNoSpendingStreak = 0;
        currentNoSpendingStart = '';

        if (currentSpendingStreak > longestSpendingStreak.days) {
          longestSpendingStreak = {
            days: currentSpendingStreak,
            startDate: currentSpendingStart,
            endDate: dayStr,
          };
        }
      } else {
        if (currentNoSpendingStreak === 0) {
          currentNoSpendingStart = dayStr;
        }
        currentNoSpendingStreak++;
        currentSpendingStreak = 0;
        currentSpendingStart = '';

        if (currentNoSpendingStreak > longestNoSpendingStreak.days) {
          longestNoSpendingStreak = {
            days: currentNoSpendingStreak,
            startDate: currentNoSpendingStart,
            endDate: dayStr,
          };
        }
      }
    });

    const spendingStreaks: SpendingStreaks = {
      longestSpendingStreak,
      longestNoSpendingStreak,
      totalSpendingDays: daysWithTransactions.size,
      totalNoSpendingDays: totalDays - daysWithTransactions.size,
    };

    // Transaction Size Distribution
    const transactionAmounts = expenseTransactions
      .map(t => integerToAmount(Math.abs(t.amount)))
      .sort((a, b) => a - b);

    const buckets = [
      { range: '$0-$10', min: 0, max: 10 },
      { range: '$10-$50', min: 10, max: 50 },
      { range: '$50-$100', min: 50, max: 100 },
      { range: '$100-$500', min: 100, max: 500 },
      { range: '$500+', min: 500, max: Infinity },
    ].map(bucket => {
      const count = transactionAmounts.filter(
        amt => amt >= bucket.min && (bucket.max === Infinity || amt < bucket.max),
      ).length;
      return {
        ...bucket,
        count,
        percentage: transactionAmounts.length > 0 ? (count / transactionAmounts.length) * 100 : 0,
      };
    });

    const median =
      transactionAmounts.length > 0
        ? transactionAmounts.length % 2 === 0
          ? (transactionAmounts[transactionAmounts.length / 2 - 1] +
              transactionAmounts[transactionAmounts.length / 2]) /
            2
          : transactionAmounts[Math.floor(transactionAmounts.length / 2)]
        : 0;

    // Calculate mode (most common value range)
    const modeBucket = buckets.reduce(
      (max, bucket) => (bucket.count > max.count ? bucket : max),
      buckets[0],
    );
    const mode =
      modeBucket.min + (modeBucket.max === Infinity ? 500 : (modeBucket.max - modeBucket.min) / 2);

    const transactionSizeDistribution: TransactionSizeDistribution = {
      buckets,
      median,
      mode,
      mostCommonRange: modeBucket.range,
    };

    // Quarterly Comparison
    const quarterlyData: QuarterlyData[] = [
      {
        quarter: 'Q1',
        months: ['January', 'February', 'March'],
        income: 0,
        expenses: 0,
        netSavings: 0,
      },
      {
        quarter: 'Q2',
        months: ['April', 'May', 'June'],
        income: 0,
        expenses: 0,
        netSavings: 0,
      },
      {
        quarter: 'Q3',
        months: ['July', 'August', 'September'],
        income: 0,
        expenses: 0,
        netSavings: 0,
      },
      {
        quarter: 'Q4',
        months: ['October', 'November', 'December'],
        income: 0,
        expenses: 0,
        netSavings: 0,
      },
    ];

    quarterlyData.forEach(quarter => {
      quarter.months.forEach(monthName => {
        const monthData = monthlyData.find(m => m.month === monthName);
        if (monthData) {
          quarter.income += monthData.income;
          quarter.expenses += monthData.expenses;
          quarter.netSavings += monthData.netSavings;
        }
      });
    });

    // Category Growth/Decline
    const categoryGrowth: CategoryGrowth[] = topCategories.map(cat => {
      const firstMonth =
        cat.categoryId === 'uncategorized' || cat.categoryId === 'off-budget'
          ? { month: 'January', amount: 0 }
          : categoryTrends
              .find(t => t.categoryId === cat.categoryId)
              ?.monthlyData.find(m => m.month === 'January') || { month: 'January', amount: 0 };
      const lastMonth =
        cat.categoryId === 'uncategorized' || cat.categoryId === 'off-budget'
          ? { month: 'December', amount: 0 }
          : categoryTrends
              .find(t => t.categoryId === cat.categoryId)
              ?.monthlyData.find(m => m.month === 'December') || { month: 'December', amount: 0 };

      const monthlyChanges = MONTHS.map((monthName, monthIndex) => {
        const monthAmount =
          cat.categoryId === 'uncategorized' || cat.categoryId === 'off-budget'
            ? 0
            : categoryTrends
                .find(t => t.categoryId === cat.categoryId)
                ?.monthlyData.find(m => m.month === monthName)?.amount || 0;
        const prevMonthAmount =
          monthIndex > 0
            ? cat.categoryId === 'uncategorized' || cat.categoryId === 'off-budget'
              ? 0
              : categoryTrends
                  .find(t => t.categoryId === cat.categoryId)
                  ?.monthlyData.find(m => m.month === MONTHS[monthIndex - 1])?.amount || 0
            : 0;
        const change = monthAmount - prevMonthAmount;
        const percentageChange = prevMonthAmount > 0 ? (change / prevMonthAmount) * 100 : 0;

        return {
          month: monthName,
          amount: monthAmount,
          change,
          percentageChange,
        };
      });

      const totalChange = lastMonth.amount - firstMonth.amount;
      const percentageChange = firstMonth.amount > 0 ? (totalChange / firstMonth.amount) * 100 : 0;

      return {
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        firstMonthAmount: firstMonth.amount,
        lastMonthAmount: lastMonth.amount,
        totalChange,
        percentageChange,
        monthlyChanges,
      };
    });

    // Savings Milestones - Calculate based on cumulative savings from monthly data
    const savingsMilestones: SavingsMilestone[] = [];
    let cumulativeSavingsForMilestones = 0;

    // Track cumulative savings month by month to find when milestones are reached
    monthlyData.forEach(monthData => {
      const previousCumulative = cumulativeSavingsForMilestones;
      cumulativeSavingsForMilestones += monthData.netSavings;

      // Check each threshold to see if we crossed it this month
      SAVINGS_MILESTONE_THRESHOLDS.forEach(threshold => {
        if (
          previousCumulative < threshold &&
          cumulativeSavingsForMilestones >= threshold &&
          !savingsMilestones.find(m => m.amount === threshold)
        ) {
          // Use the last day of the month as the milestone date
          const monthIndex = MONTHS.indexOf(monthData.month);
          const milestoneDate = format(endOfMonth(new Date(year, monthIndex, 1)), 'yyyy-MM-dd');
          savingsMilestones.push({
            milestone: `$${(threshold / 1000).toFixed(0)}k`,
            amount: threshold,
            date: milestoneDate,
            cumulativeSavings: cumulativeSavingsForMilestones,
          });
        }
      });
    });

    // Future Projection
    // Reuse totalDays from Spending Velocity calculation above
    const dailyAverageIncome = totalDays > 0 ? totalIncome / totalDays : 0;
    const dailyAverageExpenses = totalDays > 0 ? totalExpenses / totalDays : 0;
    const dailyNetSavings = dailyAverageIncome - dailyAverageExpenses;

    // Calculate actual 2025 cumulative savings by month
    let actualCumulativeSavings = 0;
    const actual2025Data = monthlyData.map(monthData => {
      actualCumulativeSavings += monthData.netSavings;
      return {
        month: monthData.month,
        cumulativeSavings: actualCumulativeSavings,
      };
    });

    // Project next 12 months (2026)
    // Start from December 2025's cumulative savings (last actual month)
    const december2025CumulativeSavings =
      actual2025Data.length > 0
        ? actual2025Data[actual2025Data.length - 1].cumulativeSavings
        : netSavings;

    const nextYearMonths = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const daysPerMonth = DAYS_PER_MONTH;
    let cumulativeSavings = december2025CumulativeSavings; // Start from December 2025
    let monthsUntilZero: number | null = null;

    const monthlyProjections = nextYearMonths.map((month, index) => {
      const projectedIncome = dailyAverageIncome * daysPerMonth;
      const projectedExpenses = dailyAverageExpenses * daysPerMonth;
      const projectedNetSavings = projectedIncome - projectedExpenses;

      // For January 2026, keep the same value as December 2025 (no change yet)
      // For subsequent months, add the projected net savings
      if (index > 0) {
        cumulativeSavings += projectedNetSavings;
      }
      // For index 0 (January), cumulativeSavings stays at december2025CumulativeSavings

      // Find when savings reach zero (only set once)
      if (monthsUntilZero === null && cumulativeSavings <= 0 && index > 0) {
        monthsUntilZero = index + 1;
      }

      return {
        month,
        projectedIncome,
        projectedExpenses,
        projectedNetSavings,
        cumulativeSavings,
      };
    });

    const projectedYearEndSavings = cumulativeSavings;

    const futureProjection: FutureProjection = {
      dailyAverageIncome,
      dailyAverageExpenses,
      dailyNetSavings,
      actual2025Data,
      monthlyProjections,
      monthsUntilZero,
      projectedYearEndSavings,
    };

    // Create map of category ID to group name
    const categoryIdToGroup = new Map<string, string>();
    categories.forEach(cat => {
      if (cat.group) {
        categoryIdToGroup.set(cat.id, cat.group);
      }
    });

    // Calculate budget comparison if budget data is available
    const budgetComparison = calculateBudgetComparison(
      expenseTransactions,
      categories,
      budgetData || [],
      accountOffbudgetMap,
      categoryIdToName,
      categoryIdToGroup,
    );

    // Add group sort orders to budget comparison if available
    if (budgetComparison && groupSortOrders.size > 0) {
      budgetComparison.groupSortOrder = groupSortOrders;
    }

    return {
      year,
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      monthlyData,
      topCategories,
      categoryTrends,
      topPayees,
      allPayees, // Include all payees for re-sorting
      transactionStats,
      topMonths,
      calendarData,
      fetchedAt: new Date(),
      allTransactions: yearTransactions, // Store transactions for filtering (2025 only)
      allCategories: categories, // Store all categories for transfer detection
      spendingVelocity,
      dayOfWeekSpending,
      accountBreakdown,
      spendingStreaks,
      transactionSizeDistribution,
      quarterlyData,
      categoryGrowth,
      savingsMilestones,
      futureProjection,
      budgetComparison,
    };
  } catch (error) {
    if (isDataTransformError(error)) {
      throw error;
    }
    const errorMessage = getErrorMessage(error);
    throw new DataTransformError(`Failed to transform data: ${errorMessage}`, error);
  }
}
