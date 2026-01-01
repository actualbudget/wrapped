import type {
  WrappedData,
  MonthlyData,
  CategorySpending,
  PayeeSpending,
  CategoryTrend,
  TransactionStats,
  CalendarDay,
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

function createMockMonthlyData(overrides?: Partial<MonthlyData>[]): MonthlyData[] {
  return MONTHS.map((month, index) => ({
    month,
    income: 5000 + index * 100,
    expenses: 3000 + index * 200,
    netSavings: 2000 - index * 100,
    ...overrides?.[index],
  }));
}

function createMockTopMonths(
  count: number = 3,
  overrides?: Partial<Array<{ month: string; spending: number }>>,
): Array<{ month: string; spending: number }> {
  const months = MONTHS.slice(0, count);
  return months.map((month, index) => ({
    month,
    spending: 5000 - index * 500,
    ...overrides?.[index],
  }));
}

export function createMockSpendingVelocity(
  overrides?: Partial<SpendingVelocity>,
): SpendingVelocity {
  return {
    dailyAverage: 100,
    fastestPeriod: {
      period: 'Week 15',
      amount: 2000,
      averagePerDay: 285.71,
    },
    slowestPeriod: {
      period: 'Week 3',
      amount: 500,
      averagePerDay: 71.43,
    },
    weeklyData: [
      { week: 'Week 1', totalSpending: 1500, averagePerDay: 214.29 },
      { week: 'Week 2', totalSpending: 1200, averagePerDay: 171.43 },
    ],
    ...overrides,
  };
}

function createMockDayOfWeekSpending(
  overrides?: Partial<DayOfWeekSpending>[],
): DayOfWeekSpending[] {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayNames.map((dayName, index) => ({
    dayOfWeek: index,
    dayName,
    totalSpending: 1000 + index * 100,
    transactionCount: 10 + index,
    averageTransactionSize: 100 + index * 10,
    ...overrides?.[index],
  }));
}

export function createMockAccountBreakdown(overrides?: AccountBreakdown[]): AccountBreakdown[] {
  const defaultData: AccountBreakdown[] = [
    {
      accountId: 'acc1',
      accountName: 'Checking',
      totalSpending: 20000,
      transactionCount: 50,
      percentage: 55.6,
    },
    {
      accountId: 'acc2',
      accountName: 'Credit Card',
      totalSpending: 16000,
      transactionCount: 40,
      percentage: 44.4,
    },
  ];
  return overrides || defaultData;
}

function createMockSpendingStreaks(overrides?: Partial<SpendingStreaks>): SpendingStreaks {
  return {
    longestSpendingStreak: {
      days: 15,
      startDate: '2025-03-01',
      endDate: '2025-03-15',
    },
    longestNoSpendingStreak: {
      days: 5,
      startDate: '2025-06-10',
      endDate: '2025-06-14',
    },
    totalSpendingDays: 200,
    totalNoSpendingDays: 165,
    ...overrides,
  };
}

function createMockTransactionSizeDistribution(
  overrides?: Partial<TransactionSizeDistribution>,
): TransactionSizeDistribution {
  return {
    buckets: [
      { range: '$0-$10', min: 0, max: 10, count: 20, percentage: 20 },
      { range: '$10-$50', min: 10, max: 50, count: 40, percentage: 40 },
      { range: '$50-$100', min: 50, max: 100, count: 25, percentage: 25 },
      { range: '$100+', min: 100, max: Infinity, count: 15, percentage: 15 },
    ],
    median: 45,
    mode: 25,
    mostCommonRange: '$10-$50',
    ...overrides,
  };
}

function createMockQuarterlyData(overrides?: QuarterlyData[]): QuarterlyData[] {
  const defaultData: QuarterlyData[] = [
    {
      quarter: 'Q1',
      income: 15000,
      expenses: 9000,
      netSavings: 6000,
      months: ['January', 'February', 'March'],
    },
    {
      quarter: 'Q2',
      income: 15000,
      expenses: 9000,
      netSavings: 6000,
      months: ['April', 'May', 'June'],
    },
    {
      quarter: 'Q3',
      income: 15000,
      expenses: 9000,
      netSavings: 6000,
      months: ['July', 'August', 'September'],
    },
    {
      quarter: 'Q4',
      income: 15000,
      expenses: 9000,
      netSavings: 6000,
      months: ['October', 'November', 'December'],
    },
  ];
  return overrides || defaultData;
}

export function createMockCategoryGrowth(overrides?: CategoryGrowth[]): CategoryGrowth[] {
  const defaultData: CategoryGrowth[] = [
    {
      categoryId: 'cat1',
      categoryName: 'Groceries',
      firstMonthAmount: 400,
      lastMonthAmount: 600,
      totalChange: 200,
      percentageChange: 50,
      monthlyChanges: [
        { month: 'January', amount: 400, change: 0, percentageChange: 0 },
        { month: 'February', amount: 450, change: 50, percentageChange: 12.5 },
        { month: 'March', amount: 500, change: 50, percentageChange: 11.1 },
      ],
    },
  ];
  return overrides || defaultData;
}

export function createMockSavingsMilestones(overrides?: SavingsMilestone[]): SavingsMilestone[] {
  const defaultData: SavingsMilestone[] = [
    {
      milestone: '$10k',
      amount: 10000,
      date: '2025-04-15',
      cumulativeSavings: 10000,
    },
    {
      milestone: '$25k',
      amount: 25000,
      date: '2025-08-20',
      cumulativeSavings: 25000,
    },
  ];
  return overrides || defaultData;
}

export function createMockFutureProjection(
  overrides?: Partial<FutureProjection>,
): FutureProjection {
  return {
    dailyAverageIncome: 164.38,
    dailyAverageExpenses: 98.63,
    dailyNetSavings: 65.75,
    actual2025Data: [
      { month: 'January', cumulativeSavings: 2000 },
      { month: 'February', cumulativeSavings: 4000 },
      { month: 'March', cumulativeSavings: 6000 },
      { month: 'April', cumulativeSavings: 8000 },
      { month: 'May', cumulativeSavings: 10000 },
      { month: 'June', cumulativeSavings: 12000 },
      { month: 'July', cumulativeSavings: 14000 },
      { month: 'August', cumulativeSavings: 16000 },
      { month: 'September', cumulativeSavings: 18000 },
      { month: 'October', cumulativeSavings: 20000 },
      { month: 'November', cumulativeSavings: 22000 },
      { month: 'December', cumulativeSavings: 24000 },
    ],
    monthlyProjections: [
      {
        month: 'January',
        projectedIncome: 5000,
        projectedExpenses: 3000,
        projectedNetSavings: 2000,
        cumulativeSavings: 26000,
      },
      {
        month: 'February',
        projectedIncome: 5000,
        projectedExpenses: 3000,
        projectedNetSavings: 2000,
        cumulativeSavings: 28000,
      },
    ],
    monthsUntilZero: null,
    projectedYearEndSavings: 48000,
    ...overrides,
  };
}

export function createMockBudgetComparison(
  overrides?: Partial<BudgetComparisonData>,
): BudgetComparisonData {
  const monthlyBudgets = MONTHS.map((month, index) => ({
    month,
    budgetedAmount: 500,
    actualAmount: 450 + index * 10,
    carryForward: index === 0 ? 0 : 50,
    effectiveBudget: index === 0 ? 500 : 550,
    remaining: index === 0 ? 50 : 100 - index * 10,
    variance: index === 0 ? -50 : -100 + index * 10,
    variancePercentage: index === 0 ? -10 : -18.18 + index * 1.82,
  }));

  const categoryBudgets: CategoryBudget[] = [
    {
      categoryId: 'cat1',
      categoryName: 'Groceries',
      categoryGroup: 'Food',
      monthlyBudgets,
      totalBudgeted: 6000,
      totalActual: 5400,
      totalVariance: -600,
      totalVariancePercentage: -10,
    },
    {
      categoryId: 'cat2',
      categoryName: 'Rent',
      categoryGroup: 'Housing',
      monthlyBudgets: MONTHS.map(month => ({
        month,
        budgetedAmount: 1200,
        actualAmount: 1200,
        carryForward: 0,
        effectiveBudget: 1200,
        remaining: 0,
        variance: 0,
        variancePercentage: 0,
      })),
      totalBudgeted: 14400,
      totalActual: 14400,
      totalVariance: 0,
      totalVariancePercentage: 0,
    },
  ];

  return {
    categoryBudgets: overrides?.categoryBudgets || categoryBudgets,
    monthlyTotals: MONTHS.map((month, index) => ({
      month,
      totalBudgeted: 1700,
      totalActual: 1650 + index * 10,
      variance: -50 - index * 10,
    })),
    overallBudgeted: 20400,
    overallActual: 19800,
    overallVariance: -600,
    overallVariancePercentage: -2.94,
    groupSortOrder: new Map([
      ['Food', 1],
      ['Housing', 2],
    ]),
    ...overrides,
  };
}

export function createMockWrappedData(overrides?: Partial<WrappedData>): WrappedData {
  const monthlyData = createMockMonthlyData();
  const topMonths = createMockTopMonths(3);

  return {
    year: 2025,
    totalIncome: 60000,
    totalExpenses: 36000,
    netSavings: 24000,
    savingsRate: 40,
    monthlyData,
    topCategories: [
      {
        categoryId: 'cat1',
        categoryName: 'Groceries',
        amount: 5000,
        percentage: 13.9,
      },
      {
        categoryId: 'cat2',
        categoryName: 'Rent',
        amount: 12000,
        percentage: 33.3,
      },
    ] as CategorySpending[],
    categoryTrends: [] as CategoryTrend[],
    topPayees: [
      {
        payee: 'Store A',
        amount: 2000,
        transactionCount: 10,
      },
    ] as PayeeSpending[],
    transactionStats: {
      totalCount: 100,
      averageAmount: 360,
      largestTransaction: null,
    } as TransactionStats,
    topMonths,
    calendarData: [] as CalendarDay[],
    fetchedAt: new Date(),
    spendingVelocity: createMockSpendingVelocity(),
    dayOfWeekSpending: createMockDayOfWeekSpending(),
    accountBreakdown: createMockAccountBreakdown(),
    spendingStreaks: createMockSpendingStreaks(),
    transactionSizeDistribution: createMockTransactionSizeDistribution(),
    quarterlyData: createMockQuarterlyData(),
    categoryGrowth: createMockCategoryGrowth(),
    savingsMilestones: createMockSavingsMilestones(),
    futureProjection: createMockFutureProjection(),
    budgetComparison: undefined,
    currencySymbol: '$',
    ...overrides,
  };
}
