export interface Transaction {
  id: string;
  account: string;
  date: string;
  amount: number;
  payee?: string;
  payee_name?: string;
  payee_tombstone?: boolean; // Whether the payee is deleted
  notes?: string;
  category?: string;
  category_name?: string; // Category name if available directly from transaction
  category_tombstone?: boolean; // Whether the category is deleted
  cleared?: boolean;
  reconciled?: boolean;
}

export interface Category {
  id: string;
  name: string;
  group?: string;
  is_income?: boolean;
  tombstone?: boolean; // Whether the category is deleted
}

export interface Account {
  id: string;
  name: string;
  type: string;
  offbudget?: boolean;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  netSavings: number;
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
}

export interface PayeeSpending {
  payee: string;
  amount: number;
  transactionCount: number;
}

export interface CategoryTrend {
  categoryId: string;
  categoryName: string;
  monthlyData: Array<{ month: string; amount: number }>;
}

export interface TransactionStats {
  totalCount: number;
  averageAmount: number;
  largestTransaction: Transaction | null;
}

export interface CalendarDay {
  date: string;
  count: number;
  amount: number;
}

export interface SpendingVelocity {
  dailyAverage: number;
  fastestPeriod: { period: string; amount: number; averagePerDay: number };
  slowestPeriod: { period: string; amount: number; averagePerDay: number };
  weeklyData: Array<{ week: string; totalSpending: number; averagePerDay: number }>;
}

export interface DayOfWeekSpending {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  dayName: string;
  totalSpending: number;
  transactionCount: number;
  averageTransactionSize: number;
}

export interface AccountBreakdown {
  accountId: string;
  accountName: string;
  totalSpending: number;
  transactionCount: number;
  percentage: number;
}

export interface SpendingStreaks {
  longestSpendingStreak: { days: number; startDate: string; endDate: string };
  longestNoSpendingStreak: { days: number; startDate: string; endDate: string };
  totalSpendingDays: number;
  totalNoSpendingDays: number;
}

export interface TransactionSizeDistribution {
  buckets: Array<{ range: string; min: number; max: number; count: number; percentage: number }>;
  median: number;
  mode: number;
  mostCommonRange: string;
}

export interface QuarterlyData {
  quarter: string; // "Q1", "Q2", "Q3", "Q4"
  income: number;
  expenses: number;
  netSavings: number;
  months: string[];
}

export interface CategoryGrowth {
  categoryId: string;
  categoryName: string;
  firstMonthAmount: number;
  lastMonthAmount: number;
  totalChange: number;
  percentageChange: number;
  monthlyChanges: Array<{
    month: string;
    amount: number;
    change: number;
    percentageChange: number;
  }>;
}

export interface SavingsMilestone {
  milestone: string; // "$10k", "$25k", etc.
  amount: number;
  date: string;
  cumulativeSavings: number;
}

export interface FutureProjection {
  dailyAverageIncome: number;
  dailyAverageExpenses: number;
  dailyNetSavings: number;
  actual2025Data: Array<{
    month: string;
    cumulativeSavings: number;
  }>;
  monthlyProjections: Array<{
    month: string;
    projectedIncome: number;
    projectedExpenses: number;
    projectedNetSavings: number;
    cumulativeSavings: number;
  }>;
  monthsUntilZero: number | null; // null if never reaches zero
  projectedYearEndSavings: number;
}

export interface CategoryBudget {
  categoryId: string;
  categoryName: string;
  categoryGroup?: string;
  monthlyBudgets: Array<{
    month: string;
    budgetedAmount: number;
    actualAmount: number;
    carryForward: number; // Amount carried forward from previous month
    effectiveBudget: number; // budgetedAmount + carryForward (available to spend)
    remaining: number; // effectiveBudget - actualAmount (carries forward to next month)
    variance: number; // actualAmount - effectiveBudget
    variancePercentage: number;
  }>;
  totalBudgeted: number;
  totalActual: number;
  totalVariance: number;
  totalVariancePercentage: number;
}

export interface BudgetComparisonData {
  categoryBudgets: CategoryBudget[];
  monthlyTotals: Array<{
    month: string;
    totalBudgeted: number;
    totalActual: number;
    variance: number;
  }>;
  overallBudgeted: number;
  overallActual: number;
  overallVariance: number;
  overallVariancePercentage: number;
  groupSortOrder?: Map<string, number>; // Map of group name to sort_order
  groupTombstones?: Map<string, boolean>; // Map of group name to tombstone status
}

export interface WrappedData {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  monthlyData: MonthlyData[];
  topCategories: CategorySpending[];
  categoryTrends: CategoryTrend[];
  topPayees: PayeeSpending[];
  allPayees?: PayeeSpending[]; // Optional: all payees for re-sorting by different metrics
  transactionStats: TransactionStats;
  topMonths: Array<{ month: string; spending: number }>;
  calendarData: CalendarDay[];
  fetchedAt: Date;
  allTransactions?: Transaction[]; // Optional: store raw transactions for filtering
  allCategories?: Array<{ id: string; name: string }>; // Optional: store all categories for filtering
  spendingVelocity: SpendingVelocity;
  dayOfWeekSpending: DayOfWeekSpending[];
  accountBreakdown: AccountBreakdown[];
  spendingStreaks: SpendingStreaks;
  transactionSizeDistribution: TransactionSizeDistribution;
  quarterlyData: QuarterlyData[];
  categoryGrowth: CategoryGrowth[];
  savingsMilestones: SavingsMilestone[];
  futureProjection: FutureProjection;
  budgetComparison?: BudgetComparisonData;
  currencySymbol: string; // Currency symbol from preferences table (defaults to "$")
}
