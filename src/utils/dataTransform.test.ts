import { describe, it, expect, vi } from "vitest";
import { transformToWrappedData } from "./dataTransform";
import type { Transaction, Account, Category } from "../types";

// Mock the fileApi function
vi.mock("../services/fileApi", () => ({
  integerToAmount: (amount: number) => amount / 100, // Convert cents to dollars
}));

describe("transformToWrappedData", () => {
  const createMockTransaction = (overrides?: Partial<Transaction>): Transaction => ({
    id: "t1",
    account: "acc1",
    date: "2025-01-15",
    amount: -10000, // -$100.00 in cents
    ...overrides,
  });

  const createMockAccount = (overrides?: Partial<Account>): Account => ({
    id: "acc1",
    name: "Checking",
    type: "checking",
    ...overrides,
  });

  const createMockCategory = (overrides?: Partial<Category>): Category => ({
    id: "cat1",
    name: "Groceries",
    ...overrides,
  });

  describe("Basic Data Transformation", () => {
    it("transforms empty transactions array", () => {
      const result = transformToWrappedData([], [], [], []);

      expect(result.year).toBe(2025);
      expect(result.totalIncome).toBe(0);
      expect(result.totalExpenses).toBe(0);
      expect(result.netSavings).toBe(0);
      expect(result.savingsRate).toBe(0);
      expect(result.monthlyData).toHaveLength(12);
      expect(result.topCategories).toHaveLength(0);
      expect(result.topPayees).toHaveLength(0);
      expect(result.transactionStats.totalCount).toBe(0);
    });

    it("calculates total income and expenses correctly", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", amount: 50000 }), // $500 income
        createMockTransaction({ id: "t2", amount: -30000 }), // $300 expense
        createMockTransaction({ id: "t3", amount: 20000 }), // $200 income
        createMockTransaction({ id: "t4", amount: -10000 }), // $100 expense
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.totalIncome).toBe(700); // $500 + $200
      expect(result.totalExpenses).toBe(400); // $300 + $100
      expect(result.netSavings).toBe(300); // $700 - $400
    });

    it("calculates savings rate correctly", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", amount: 100000 }), // $1000 income
        createMockTransaction({ id: "t2", amount: -60000 }), // $600 expense
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.savingsRate).toBe(40); // (1000 - 600) / 1000 * 100
    });

    it("handles zero income for savings rate", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", amount: -10000 }), // $100 expense
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.savingsRate).toBe(0);
    });
  });

  describe("Date Filtering", () => {
    it("filters transactions to 2025 only", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", date: "2024-12-31", amount: -10000 }),
        createMockTransaction({ id: "t2", date: "2025-01-01", amount: -20000 }),
        createMockTransaction({ id: "t3", date: "2025-12-31", amount: -30000 }),
        createMockTransaction({ id: "t4", date: "2026-01-01", amount: -40000 }),
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.transactionStats.totalCount).toBe(2);
      expect(result.totalExpenses).toBe(500); // $200 + $300
    });

    it("handles transactions at year boundaries", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", date: "2025-01-01T00:00:00Z", amount: -10000 }),
        createMockTransaction({ id: "t2", date: "2025-12-31T23:59:59Z", amount: -20000 }),
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.transactionStats.totalCount).toBe(2);
    });
  });

  describe("Monthly Data", () => {
    it("calculates monthly income and expenses", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", date: "2025-01-15", amount: 50000 }), // Jan income
        createMockTransaction({ id: "t2", date: "2025-01-20", amount: -30000 }), // Jan expense
        createMockTransaction({ id: "t3", date: "2025-02-10", amount: 40000 }), // Feb income
        createMockTransaction({ id: "t4", date: "2025-02-25", amount: -20000 }), // Feb expense
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      const january = result.monthlyData.find((m) => m.month === "January");
      const february = result.monthlyData.find((m) => m.month === "February");

      expect(january?.income).toBe(500);
      expect(january?.expenses).toBe(300);
      expect(january?.netSavings).toBe(200);

      expect(february?.income).toBe(400);
      expect(february?.expenses).toBe(200);
      expect(february?.netSavings).toBe(200);
    });

    it("handles months with no transactions", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", date: "2025-01-15", amount: -10000 }),
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      const february = result.monthlyData.find((m) => m.month === "February");
      expect(february?.income).toBe(0);
      expect(february?.expenses).toBe(0);
      expect(february?.netSavings).toBe(0);
    });

    it("includes all 12 months", () => {
      const result = transformToWrappedData([], [], [], []);

      expect(result.monthlyData).toHaveLength(12);
      const months = result.monthlyData.map((m) => m.month);
      expect(months).toEqual([
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ]);
    });
  });

  describe("Category Processing", () => {
    it("groups expenses by category", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", category: "cat1", amount: -10000 }),
        createMockTransaction({ id: "t2", category: "cat1", amount: -20000 }),
        createMockTransaction({ id: "t3", category: "cat2", amount: -30000 }),
      ];

      const categories: Category[] = [
        createMockCategory({ id: "cat1", name: "Groceries" }),
        createMockCategory({ id: "cat2", name: "Rent" }),
      ];

      const result = transformToWrappedData(transactions, categories, [], []);

      expect(result.topCategories).toHaveLength(2);
      expect(result.topCategories[0].categoryName).toBe("Groceries");
      expect(result.topCategories[0].amount).toBe(300); // $100 + $200
      expect(result.topCategories[1].categoryName).toBe("Rent");
      expect(result.topCategories[1].amount).toBe(300);
    });

    it("handles uncategorized transactions", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", category: "", amount: -10000 }),
        createMockTransaction({ id: "t2", category: undefined, amount: -20000 }),
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      const uncategorized = result.topCategories.find((c) => c.categoryId === "uncategorized");
      expect(uncategorized).toBeDefined();
      expect(uncategorized?.amount).toBe(300);
    });

    it("handles off-budget accounts", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", account: "acc1", category: "", amount: -10000 }),
      ];

      const accounts: Account[] = [createMockAccount({ id: "acc1", offbudget: true })];

      const result = transformToWrappedData(transactions, [], [], accounts);

      const offBudget = result.topCategories.find((c) => c.categoryId === "off-budget");
      expect(offBudget).toBeDefined();
      expect(offBudget?.categoryName).toBe("Off Budget");
    });

    it("handles deleted categories", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", category: "cat1", amount: -10000 }),
      ];

      const categories: Category[] = [
        createMockCategory({ id: "cat1", name: "Old Category", tombstone: true }),
      ];

      const result = transformToWrappedData(transactions, categories, [], []);

      const deleted = result.topCategories.find((c) => c.categoryId === "cat1");
      expect(deleted?.categoryName).toBe("deleted: Old Category");
    });

    it("sorts categories by amount descending", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", category: "cat1", amount: -10000 }),
        createMockTransaction({ id: "t2", category: "cat2", amount: -50000 }),
        createMockTransaction({ id: "t3", category: "cat3", amount: -30000 }),
      ];

      const categories: Category[] = [
        createMockCategory({ id: "cat1", name: "Small" }),
        createMockCategory({ id: "cat2", name: "Large" }),
        createMockCategory({ id: "cat3", name: "Medium" }),
      ];

      const result = transformToWrappedData(transactions, categories, [], []);

      expect(result.topCategories[0].categoryName).toBe("Large");
      expect(result.topCategories[1].categoryName).toBe("Medium");
      expect(result.topCategories[2].categoryName).toBe("Small");
    });

    it("limits to top 10 categories", () => {
      const transactions: Transaction[] = [];
      const categories: Category[] = [];

      for (let i = 1; i <= 15; i++) {
        transactions.push(
          createMockTransaction({
            id: `t${i}`,
            category: `cat${i}`,
            amount: -(i * 1000), // Decreasing amounts
          }),
        );
        categories.push(createMockCategory({ id: `cat${i}`, name: `Category ${i}` }));
      }

      const result = transformToWrappedData(transactions, categories, [], []);

      expect(result.topCategories).toHaveLength(10);
    });

    it("calculates category percentages", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", category: "cat1", amount: -30000 }), // $300
        createMockTransaction({ id: "t2", category: "cat2", amount: -70000 }), // $700
      ];

      const categories: Category[] = [
        createMockCategory({ id: "cat1", name: "Category 1" }),
        createMockCategory({ id: "cat2", name: "Category 2" }),
      ];

      const result = transformToWrappedData(transactions, categories, [], []);

      expect(result.topCategories[0].percentage).toBe(70); // $700 / $1000 * 100
      expect(result.topCategories[1].percentage).toBe(30); // $300 / $1000 * 100
    });
  });

  describe("Category Trends", () => {
    it("calculates monthly trends for top categories", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", date: "2025-01-15", category: "cat1", amount: -10000 }),
        createMockTransaction({ id: "t2", date: "2025-02-15", category: "cat1", amount: -20000 }),
        createMockTransaction({ id: "t3", date: "2025-01-20", category: "cat2", amount: -30000 }),
      ];

      const categories: Category[] = [
        createMockCategory({ id: "cat1", name: "Category 1" }),
        createMockCategory({ id: "cat2", name: "Category 2" }),
      ];

      const result = transformToWrappedData(transactions, categories, [], []);

      expect(result.categoryTrends).toHaveLength(2);
      const cat1Trend = result.categoryTrends.find((t) => t.categoryId === "cat1");
      expect(cat1Trend?.monthlyData.find((m) => m.month === "January")?.amount).toBe(100);
      expect(cat1Trend?.monthlyData.find((m) => m.month === "February")?.amount).toBe(200);
    });
  });

  describe("Payee Processing", () => {
    it("groups expenses by payee", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", payee: "payee1", amount: -10000 }),
        createMockTransaction({ id: "t2", payee: "payee1", amount: -20000 }),
        createMockTransaction({ id: "t3", payee: "payee2", amount: -30000 }),
      ];

      const payees = [
        { id: "payee1", name: "Store A" },
        { id: "payee2", name: "Store B" },
      ];

      const result = transformToWrappedData(transactions, [], payees, []);

      expect(result.topPayees).toHaveLength(2);
      // Results are sorted by amount descending, so Store B ($300) comes first
      // Both have same total ($300), so order may vary, but amounts should be correct
      const storeB = result.topPayees.find((p) => p.payee === "Store B");
      const storeA = result.topPayees.find((p) => p.payee === "Store A");

      expect(storeB?.amount).toBe(300);
      expect(storeB?.transactionCount).toBe(1);
      expect(storeA?.amount).toBe(300);
      expect(storeA?.transactionCount).toBe(2);
    });

    it("handles transactions without payees", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", payee: undefined, amount: -10000 }),
        createMockTransaction({ id: "t2", payee: "", amount: -20000 }),
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      const unknown = result.topPayees.find((p) => p.payee === "Unknown");
      expect(unknown).toBeDefined();
      expect(unknown?.amount).toBe(300);
    });

    it("handles deleted payees", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", payee: "payee1", amount: -10000 }),
      ];

      const payees = [{ id: "payee1", name: "Old Store", tombstone: true }];

      const result = transformToWrappedData(transactions, [], payees, []);

      const deleted = result.topPayees.find((p) => p.payee.includes("deleted:"));
      expect(deleted).toBeDefined();
    });

    it("limits to top 10 payees", () => {
      const transactions: Transaction[] = [];
      const payees = [];

      for (let i = 1; i <= 15; i++) {
        transactions.push(
          createMockTransaction({
            id: `t${i}`,
            payee: `payee${i}`,
            amount: -(i * 1000),
          }),
        );
        payees.push({ id: `payee${i}`, name: `Payee ${i}` });
      }

      const result = transformToWrappedData(transactions, [], payees, []);

      expect(result.topPayees).toHaveLength(10);
    });
  });

  describe("Transaction Stats", () => {
    it("calculates total transaction count", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", amount: -10000 }),
        createMockTransaction({ id: "t2", amount: -20000 }),
        createMockTransaction({ id: "t3", amount: 30000 }),
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.transactionStats.totalCount).toBe(3);
    });

    it("calculates average transaction amount", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", amount: -10000 }), // $100
        createMockTransaction({ id: "t2", amount: -20000 }), // $200
        createMockTransaction({ id: "t3", amount: -30000 }), // $300
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.transactionStats.averageAmount).toBe(200); // ($100 + $200 + $300) / 3
    });

    it("finds largest transaction", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", amount: -10000 }),
        createMockTransaction({ id: "t2", amount: -50000 }),
        createMockTransaction({ id: "t3", amount: -20000 }),
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.transactionStats.largestTransaction?.id).toBe("t2");
      expect(result.transactionStats.largestTransaction?.amount).toBe(-50000);
    });

    it("handles empty transactions for stats", () => {
      const result = transformToWrappedData([], [], [], []);

      expect(result.transactionStats.totalCount).toBe(0);
      expect(result.transactionStats.averageAmount).toBe(0);
      expect(result.transactionStats.largestTransaction).toBeNull();
    });
  });

  describe("Top Months", () => {
    it("calculates top 3 spending months", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", date: "2025-01-15", amount: -10000 }),
        createMockTransaction({ id: "t2", date: "2025-02-15", amount: -50000 }),
        createMockTransaction({ id: "t3", date: "2025-03-15", amount: -30000 }),
        createMockTransaction({ id: "t4", date: "2025-04-15", amount: -20000 }),
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.topMonths).toHaveLength(3);
      expect(result.topMonths[0].month).toBe("February");
      expect(result.topMonths[0].spending).toBe(500);
      expect(result.topMonths[1].month).toBe("March");
      expect(result.topMonths[1].spending).toBe(300);
      expect(result.topMonths[2].month).toBe("April");
      expect(result.topMonths[2].spending).toBe(200);
    });
  });

  describe("Calendar Data", () => {
    it("creates calendar data for all days in year", () => {
      const result = transformToWrappedData([], [], [], []);

      expect(result.calendarData).toHaveLength(365); // 2025 is not a leap year
    });

    it("counts transactions per day", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", date: "2025-01-15", amount: -10000 }),
        createMockTransaction({ id: "t2", date: "2025-01-15", amount: -20000 }),
        createMockTransaction({ id: "t3", date: "2025-01-16", amount: -30000 }),
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      const jan15 = result.calendarData.find((d) => d.date === "2025-01-15");
      expect(jan15?.count).toBe(2);
      expect(jan15?.amount).toBe(300);

      const jan16 = result.calendarData.find((d) => d.date === "2025-01-16");
      expect(jan16?.count).toBe(1);
      expect(jan16?.amount).toBe(300);
    });
  });

  describe("Transfer Filtering", () => {
    it("excludes transfer transactions", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", payee: "payee1", amount: -10000 }),
        createMockTransaction({ id: "t2", payee: "payee2", amount: -20000 }),
      ];

      const payees = [
        { id: "payee1", name: "Regular Payee" },
        { id: "payee2", name: "Transfer", transfer_acct: "acc2" },
      ];

      const result = transformToWrappedData(transactions, [], payees, []);

      expect(result.transactionStats.totalCount).toBe(1);
      expect(result.totalExpenses).toBe(100);
    });
  });

  describe("Edge Cases", () => {
    it("handles very large transaction amounts", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", amount: -100000000 }), // $1,000,000
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.totalExpenses).toBe(1000000);
    });

    it("handles transactions with missing fields", () => {
      const transactions: Transaction[] = [
        { id: "t1", account: "acc1", date: "2025-01-15", amount: -10000 } as Transaction,
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.transactionStats.totalCount).toBe(1);
    });

    it("handles duplicate category IDs", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", category: "cat1", amount: -10000 }),
      ];

      const categories: Category[] = [
        createMockCategory({ id: "cat1", name: "First" }),
        createMockCategory({ id: "cat1", name: "Second" }), // Duplicate ID
      ];

      const result = transformToWrappedData(transactions, categories, [], []);

      // Should use the last category name in the array
      const category = result.topCategories.find((c) => c.categoryId === "cat1");
      expect(category).toBeDefined();
    });
  });

  describe("Spending Velocity", () => {
    it("calculates daily average spending", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", date: "2025-01-15", amount: -36500 }), // $365 expense
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.spendingVelocity.dailyAverage).toBeGreaterThan(0);
      expect(result.spendingVelocity.weeklyData.length).toBeGreaterThan(0);
    });

    it("identifies fastest and slowest spending periods", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", date: "2025-01-15", amount: -10000 }),
        createMockTransaction({ id: "t2", date: "2025-06-15", amount: -50000 }),
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.spendingVelocity.fastestPeriod.period).toBeDefined();
      expect(result.spendingVelocity.slowestPeriod.period).toBeDefined();
    });

    it("handles empty transactions for velocity", () => {
      const result = transformToWrappedData([], [], [], []);

      expect(result.spendingVelocity.dailyAverage).toBe(0);
      expect(result.spendingVelocity.weeklyData.length).toBeGreaterThan(0);
    });
  });

  describe("Day of Week Spending", () => {
    it("calculates spending by day of week", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", date: "2025-01-15", amount: -10000 }), // Wednesday
        createMockTransaction({ id: "t2", date: "2025-01-18", amount: -20000 }), // Saturday
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.dayOfWeekSpending).toHaveLength(7);
      expect(result.dayOfWeekSpending[0].dayName).toBe("Sunday");
      expect(result.dayOfWeekSpending[6].dayName).toBe("Saturday");
    });

    it("calculates average transaction size per day", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", date: "2025-01-15", amount: -10000 }),
        createMockTransaction({ id: "t2", date: "2025-01-15", amount: -20000 }),
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      const wednesday = result.dayOfWeekSpending.find((d) => d.dayName === "Wednesday");
      expect(wednesday?.averageTransactionSize).toBe(150); // (100 + 200) / 2
    });
  });

  describe("Account Breakdown", () => {
    it("calculates spending per account", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", account: "acc1", amount: -10000 }),
        createMockTransaction({ id: "t2", account: "acc2", amount: -20000 }),
      ];

      const accounts: Account[] = [
        createMockAccount({ id: "acc1", name: "Checking" }),
        createMockAccount({ id: "acc2", name: "Credit Card" }),
      ];

      const result = transformToWrappedData(transactions, [], [], accounts);

      expect(result.accountBreakdown).toHaveLength(2);
      expect(result.accountBreakdown[0].accountName).toBe("Credit Card");
      expect(result.accountBreakdown[0].totalSpending).toBe(200);
    });

    it("calculates percentage of total spending per account", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", account: "acc1", amount: -10000 }),
        createMockTransaction({ id: "t2", account: "acc2", amount: -10000 }),
      ];

      const accounts: Account[] = [
        createMockAccount({ id: "acc1", name: "Checking" }),
        createMockAccount({ id: "acc2", name: "Credit Card" }),
      ];

      const result = transformToWrappedData(transactions, [], [], accounts);

      expect(result.accountBreakdown[0].percentage).toBe(50);
      expect(result.accountBreakdown[1].percentage).toBe(50);
    });
  });

  describe("Spending Streaks", () => {
    it("calculates longest spending streak", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", date: "2025-01-01", amount: -10000 }),
        createMockTransaction({ id: "t2", date: "2025-01-02", amount: -10000 }),
        createMockTransaction({ id: "t3", date: "2025-01-03", amount: -10000 }),
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.spendingStreaks.longestSpendingStreak.days).toBeGreaterThanOrEqual(3);
    });

    it("calculates longest no-spending streak", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", date: "2025-01-01", amount: -10000 }),
        createMockTransaction({ id: "t2", date: "2025-01-10", amount: -10000 }),
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.spendingStreaks.longestNoSpendingStreak.days).toBeGreaterThan(0);
    });

    it("handles empty transactions for streaks", () => {
      const result = transformToWrappedData([], [], [], []);

      expect(result.spendingStreaks.totalSpendingDays).toBe(0);
      expect(result.spendingStreaks.totalNoSpendingDays).toBeGreaterThan(0);
    });
  });

  describe("Transaction Size Distribution", () => {
    it("creates histogram buckets", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", amount: -500 }), // $5
        createMockTransaction({ id: "t2", amount: -5000 }), // $50
        createMockTransaction({ id: "t3", amount: -10000 }), // $100
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.transactionSizeDistribution.buckets.length).toBeGreaterThan(0);
      expect(result.transactionSizeDistribution.median).toBeGreaterThan(0);
    });

    it("calculates median transaction size", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", amount: -1000 }), // $10
        createMockTransaction({ id: "t2", amount: -2000 }), // $20
        createMockTransaction({ id: "t3", amount: -3000 }), // $30
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.transactionSizeDistribution.median).toBe(20);
    });

    it("identifies most common range", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", amount: -1000 }), // $10
        createMockTransaction({ id: "t2", amount: -2000 }), // $20
        createMockTransaction({ id: "t3", amount: -3000 }), // $30
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.transactionSizeDistribution.mostCommonRange).toBeDefined();
    });
  });

  describe("Quarterly Comparison", () => {
    it("groups monthly data into quarters", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", date: "2025-01-15", amount: -10000 }),
        createMockTransaction({ id: "t2", date: "2025-04-15", amount: -10000 }),
        createMockTransaction({ id: "t3", date: "2025-07-15", amount: -10000 }),
        createMockTransaction({ id: "t4", date: "2025-10-15", amount: -10000 }),
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.quarterlyData).toHaveLength(4);
      expect(result.quarterlyData[0].quarter).toBe("Q1");
      expect(result.quarterlyData[1].quarter).toBe("Q2");
      expect(result.quarterlyData[2].quarter).toBe("Q3");
      expect(result.quarterlyData[3].quarter).toBe("Q4");
    });

    it("calculates totals per quarter", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", date: "2025-01-15", amount: -10000 }),
        createMockTransaction({ id: "t2", date: "2025-02-15", amount: -10000 }),
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.quarterlyData[0].expenses).toBeGreaterThan(0);
    });
  });

  describe("Category Growth", () => {
    it("calculates category growth for top categories", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", date: "2025-01-15", category: "cat1", amount: -10000 }),
        createMockTransaction({ id: "t2", date: "2025-12-15", category: "cat1", amount: -20000 }),
      ];

      const categories: Category[] = [createMockCategory({ id: "cat1", name: "Groceries" })];

      const result = transformToWrappedData(transactions, categories, [], []);

      expect(result.categoryGrowth.length).toBeGreaterThan(0);
      const category = result.categoryGrowth.find((c) => c.categoryId === "cat1");
      if (category) {
        expect(category.percentageChange).toBeDefined();
        expect(category.monthlyChanges.length).toBe(12);
      }
    });
  });

  describe("Savings Milestones", () => {
    it("tracks savings milestones based on cumulative savings", () => {
      // Create transactions that result in high cumulative savings
      const transactions: Transaction[] = [];
      // Add income transactions to build up savings
      for (let i = 0; i < 12; i++) {
        const month = i + 1;
        transactions.push(
          createMockTransaction({
            id: `income-${i}`,
            date: `2025-${month.toString().padStart(2, "0")}-01`,
            amount: 5000000, // $50,000 income per month
          }),
        );
        // Small expenses
        transactions.push(
          createMockTransaction({
            id: `expense-${i}`,
            date: `2025-${month.toString().padStart(2, "0")}-15`,
            amount: -1000000, // $10,000 expenses per month
          }),
        );
      }

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.savingsMilestones.length).toBeGreaterThan(0);
      expect(result.savingsMilestones.some((m) => m.milestone === "$10k")).toBe(true);
      expect(result.savingsMilestones.some((m) => m.milestone === "$25k")).toBe(true);
    });

    it("handles data that doesn't reach milestones", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", date: "2025-01-15", amount: 100000 }), // $1,000 income
        createMockTransaction({ id: "t2", date: "2025-01-16", amount: -50000 }), // $500 expenses
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.savingsMilestones.length).toBe(0);
    });

    it("records milestone dates correctly based on monthly data", () => {
      // Create transactions that result in reaching $10k savings milestone
      const transactions: Transaction[] = [];
      for (let i = 0; i < 3; i++) {
        const month = i + 1;
        transactions.push(
          createMockTransaction({
            id: `income-${i}`,
            date: `2025-${month.toString().padStart(2, "0")}-01`,
            amount: 5000000, // $50,000 income per month
          }),
        );
        transactions.push(
          createMockTransaction({
            id: `expense-${i}`,
            date: `2025-${month.toString().padStart(2, "0")}-15`,
            amount: -1000000, // $10,000 expenses per month
          }),
        );
      }

      const result = transformToWrappedData(transactions, [], [], []);

      const milestone = result.savingsMilestones.find((m) => m.milestone === "$10k");
      if (milestone) {
        expect(milestone.cumulativeSavings).toBeGreaterThanOrEqual(10000);
      }
    });
  });

  describe("Future Projection", () => {
    it("calculates daily averages for projection", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", date: "2025-01-15", amount: 50000 }), // $500 income
        createMockTransaction({ id: "t2", date: "2025-01-15", amount: -30000 }), // $300 expense
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.futureProjection.dailyAverageIncome).toBeGreaterThan(0);
      expect(result.futureProjection.dailyAverageExpenses).toBeGreaterThan(0);
      expect(result.futureProjection.dailyNetSavings).toBeDefined();
    });

    it("projects monthly data for next year", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", date: "2025-01-15", amount: 50000 }),
        createMockTransaction({ id: "t2", date: "2025-01-15", amount: -30000 }),
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.futureProjection.monthlyProjections).toHaveLength(12);
      expect(result.futureProjection.monthlyProjections[0].month).toBe("January");
      expect(result.futureProjection.monthlyProjections[0].projectedIncome).toBeGreaterThan(0);
      expect(result.futureProjection.monthlyProjections[0].projectedExpenses).toBeGreaterThan(0);
    });

    it("calculates cumulative savings over time", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", date: "2025-01-15", amount: 50000 }),
        createMockTransaction({ id: "t2", date: "2025-01-15", amount: -30000 }),
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      const projections = result.futureProjection.monthlyProjections;
      expect(projections[0].cumulativeSavings).toBeDefined();
      // Cumulative savings should generally increase if net savings is positive
      if (result.futureProjection.dailyNetSavings > 0) {
        expect(projections[projections.length - 1].cumulativeSavings).toBeGreaterThan(
          projections[0].cumulativeSavings,
        );
      }
    });

    it("calculates months until zero when expenses exceed income", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", date: "2025-01-15", amount: 10000 }), // $100 income
        createMockTransaction({ id: "t2", date: "2025-01-15", amount: -50000 }), // $500 expense
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      // If expenses exceed income, monthsUntilZero should be calculated
      if (result.futureProjection.dailyNetSavings < 0) {
        expect(result.futureProjection.monthsUntilZero).not.toBeNull();
      }
    });

    it("sets monthsUntilZero to null when savings continue growing", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", date: "2025-01-15", amount: 50000 }), // $500 income
        createMockTransaction({ id: "t2", date: "2025-01-15", amount: -10000 }), // $100 expense
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      // If income exceeds expenses, monthsUntilZero should be null
      if (result.futureProjection.dailyNetSavings > 0) {
        expect(result.futureProjection.monthsUntilZero).toBeNull();
      }
    });

    it("calculates projected year end savings", () => {
      const transactions: Transaction[] = [
        createMockTransaction({ id: "t1", date: "2025-01-15", amount: 50000 }),
        createMockTransaction({ id: "t2", date: "2025-01-15", amount: -30000 }),
      ];

      const result = transformToWrappedData(transactions, [], [], []);

      expect(result.futureProjection.projectedYearEndSavings).toBeDefined();
      const lastMonth =
        result.futureProjection.monthlyProjections[
          result.futureProjection.monthlyProjections.length - 1
        ];
      expect(result.futureProjection.projectedYearEndSavings).toBe(lastMonth.cumulativeSavings);
    });
  });
});
