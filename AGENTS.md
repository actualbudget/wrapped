# Agents.md - Tool Usage Guide

This document explains how to use the tools and utilities available in the Actual Budget Wrapped project.

## Table of Contents

- [File API Service](#file-api-service)
- [React Hooks](#react-hooks)
- [Data Transformation Utilities](#data-transformation-utilities)
- [Type Definitions](#type-definitions)

## File API Service

The File API service (`src/services/fileApi.ts`) provides functions to load and query an Actual Budget SQLite database from a zip file in the browser.

### `initialize(file: File): Promise<void>`

Initializes the file API by loading and parsing a zip file containing the Actual Budget SQLite database.

**Parameters:**

- `file`: A File object containing the exported budget zip file

**Example:**

```typescript
import { initialize } from '../services/fileApi';

const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
await initialize(file);
```

**Important:** Must be called before any other fileApi functions. Closes any existing database before loading a new one.

### `getAccounts(): Promise<Account[]>`

Retrieves all accounts from the database.

**Returns:** Array of Account objects with:

- `id`: Account ID
- `name`: Account name
- `type`: Account type
- `offbudget`: Boolean indicating if account is off-budget

**Example:**

```typescript
import { getAccounts } from '../services/fileApi';

const accounts = await getAccounts();
console.log(accounts); // [{ id: '...', name: 'Checking', type: 'checking', offbudget: false }, ...]
```

### `getCategories(): Promise<Category[]>`

Retrieves all categories from the database (including deleted categories).

**Returns:** Array of Category objects with:

- `id`: Category ID
- `name`: Category name
- `group`: Category group name (optional)
- `is_income`: Boolean indicating if category is income
- `tombstone`: Boolean indicating if category is deleted

**Example:**

```typescript
import { getCategories } from '../services/fileApi';

const categories = await getCategories();
const incomeCategories = categories.filter(cat => cat.is_income);
```

### `getPayees(): Promise<Array<{id: string, name: string, tombstone?: boolean, transfer_acct?: string}>>`

Retrieves all payees from the database (including deleted payees).

**Returns:** Array of payee objects with:

- `id`: Payee ID
- `name`: Payee name
- `tombstone`: Boolean indicating if payee is deleted
- `transfer_acct`: Account ID if this payee represents a transfer (optional)

**Example:**

```typescript
import { getPayees } from '../services/fileApi';

const payees = await getPayees();
const transferPayees = payees.filter(p => p.transfer_acct);
```

### `getAllTransactionsForYear(year: number): Promise<Transaction[]>`

Retrieves all transactions for a specific year across all accounts.

**Parameters:**

- `year`: The year (e.g., 2025)

**Returns:** Array of Transaction objects with full details including payee names, category names, and tombstone flags.

**Example:**

```typescript
import { getAllTransactionsForYear } from '../services/fileApi';

const transactions2025 = await getAllTransactionsForYear(2025);
const expenses = transactions2025.filter(t => t.amount < 0);
```

**Note:** This function returns all transactions. Filtering (transfers, off-budget transactions, and starting balances) is handled by `transformToWrappedData()`.

### `integerToAmount(amount: number): number`

Utility function to convert integer amounts (stored as cents) to decimal amounts (dollars).

**Parameters:**

- `amount`: Amount in cents (integer)

**Returns:** Amount in dollars (decimal)

**Example:**

```typescript
import { integerToAmount } from '../services/fileApi';

const cents = 12345;
const dollars = integerToAmount(cents); // 123.45
```

### `shutdown(): Promise<void>`

Shuts down and cleans up the database connection. Should be called when done with the database or when the component unmounts.

**Example:**

```typescript
import { shutdown } from '../services/fileApi';

// In cleanup or component unmount
await shutdown();
```

### `clearBudget(): Promise<void>`

Clears the current budget data by closing the database. Useful when loading a new budget file.

**Example:**

```typescript
import { clearBudget, initialize } from '../services/fileApi';

// Clear old data before loading new file
await clearBudget();
await initialize(newFile);
```

## React Hooks

### `useActualData()`

A React hook that manages loading and processing Actual Budget data from a zip file.

**Returns:** Object with:

- `data`: `WrappedData | null` - The processed wrapped data
- `loading`: `boolean` - Loading state
- `error`: `string | null` - Error message if loading failed
- `progress`: `number` - Loading progress (0-100)
- `fetchData`: `(file: File, includeOffBudget?: boolean, includeOnBudgetTransfers?: boolean, includeAllTransfers?: boolean, overrideCurrencySymbol?: string) => Promise<void>` - Function to load data from a file
- `refreshData`: `(includeOffBudget?: boolean, includeOnBudgetTransfers?: boolean, includeAllTransfers?: boolean, overrideCurrencySymbol?: string) => Promise<void>` - Function to reload data from the last loaded file
- `retransformData`: `(includeOffBudget: boolean, includeOnBudgetTransfers: boolean, includeAllTransfers: boolean, overrideCurrencySymbol?: string) => void` - Function to re-transform data with new filter settings
- `retry`: `() => Promise<void> | undefined` - Function to retry loading the last file

**Example:**

```typescript
import { useActualData } from '../hooks/useActualData';

function MyComponent() {
  const { data, loading, error, fetchData } = useActualData();

  const handleFileUpload = async (file: File) => {
    await fetchData(file);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data loaded</div>;

  return <div>Total Income: ${data.totalIncome}</div>;
}
```

**Usage Pattern:**

1. Call `fetchData(file, includeOffBudget, includeOnBudgetTransfers, includeAllTransfers, overrideCurrencySymbol)` when a user uploads a budget zip file
2. The hook automatically initializes the database, fetches all data, and transforms it
3. Access the processed `data` once loading completes
4. Use `retransformData()` to re-process data when filter toggles change (without reloading from file)
5. The hook automatically cleans up the database on component unmount

**Filter Parameters:**

- `includeOffBudget`: Include transactions from off-budget accounts (default: `false`)
- `includeOnBudgetTransfers`: Include transfers between two on-budget accounts (default: `false`)
- `includeAllTransfers`: Include transfers between on-budget and off-budget accounts (default: `false`). When enabled, automatically enables `includeOnBudgetTransfers`
- `overrideCurrencySymbol`: Override the currency symbol from the database (optional)

### `useAnimatedNumber(target: number, duration?: number, decimals?: number): number`

A React hook that animates a number from 0 to a target value over a specified duration.

**Parameters:**

- `target`: Target number to animate to
- `duration`: Animation duration in milliseconds (default: 1000)
- `decimals`: Number of decimal places (default: 0)

**Returns:** The current animated value

**Example:**

```typescript
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

function AnimatedCounter({ value }: { value: number }) {
  const animatedValue = useAnimatedNumber(value, 1500, 2);

  return <div>${animatedValue.toFixed(2)}</div>;
}
```

**Use Cases:**

- Animating currency values
- Counting up statistics
- Smooth number transitions

### `useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void]`

A React hook that syncs state with localStorage, similar to `useState` but persists values across page reloads.

**Parameters:**

- `key`: LocalStorage key name
- `initialValue`: Initial value if key doesn't exist

**Returns:** Tuple `[value, setValue]` similar to `useState`

**Example:**

```typescript
import { useLocalStorage } from '../hooks/useLocalStorage';

function Settings() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
}
```

**Features:**

- Automatically syncs with localStorage
- Handles JSON serialization/deserialization
- Supports functional updates: `setValue(prev => prev + 1)`
- Gracefully handles errors (returns initialValue on parse errors)

## Data Transformation Utilities

### `transformToWrappedData(transactions, categories, payees, accounts, year?, includeOffBudget?, includeOnBudgetTransfers?, includeAllTransfers?, currencySymbol?, budgetData?, groupSortOrders?): WrappedData`

Transforms raw transaction data into a structured `WrappedData` object with all calculated metrics and aggregations.

**Parameters:**

- `transactions`: Array of Transaction objects
- `categories`: Array of Category objects
- `payees`: Array of Payee objects
- `accounts`: Array of Account objects
- `year`: Optional year number (defaults to 2025)
- `includeOffBudget`: Optional boolean to include off-budget transactions (defaults to `false`)
- `includeOnBudgetTransfers`: Optional boolean to include transfers between two on-budget accounts (defaults to `false`)
- `includeAllTransfers`: Optional boolean to include transfers between on-budget and off-budget accounts (defaults to `false`). When `true`, automatically enables `includeOnBudgetTransfers`
- `currencySymbol`: Optional currency symbol string (defaults to `'$'`)
- `budgetData`: Optional array of budget data for budget comparison
- `groupSortOrders`: Optional map of category group sort orders

**Returns:** `WrappedData` object containing:

- Year summary (income, expenses, savings rate)
- Monthly breakdowns
- Top categories and trends
- Top payees
- Transaction statistics
- Calendar heatmap data
- Spending velocity metrics
- Day of week analysis
- Account breakdowns
- Spending streaks
- Transaction size distributions
- Quarterly comparisons
- Category growth/decline
- Savings milestones
- Future projections

**Example:**

```typescript
import { transformToWrappedData } from '../utils/dataTransform';
import { getAllTransactionsForYear, getCategories, getPayees, getAccounts } from '../services/fileApi';

const transactions = await getAllTransactionsForYear(2025);
const categories = await getCategories();
const payees = await getPayees();
const accounts = await getAccounts();

const wrappedData = transformToWrappedData(
  transactions,
  categories,
  payees,
  accounts,
  2025,
  false, // includeOffBudget
  false, // includeOnBudgetTransfers
  false, // includeAllTransfers
  '$'    // currencySymbol
);

console.log(wrappedData.totalIncome);
console.log(wrappedData.topCategories);
console.log(wrappedData.monthlyData);
```

**Important Notes:**

- Automatically filters transactions to the specified year (defaults to 2025)
- **Transfer Filtering**: By default, excludes all transfer transactions. Use `includeOnBudgetTransfers` and `includeAllTransfers` to include specific types:
  - `includeOnBudgetTransfers = true`: Includes transfers between two on-budget accounts
  - `includeAllTransfers = true`: Includes transfers between on-budget and off-budget accounts (on→off or off→on). Automatically enables `includeOnBudgetTransfers`
- **Transfer Labeling**: When transfers are included:
  - **Categories**: Transfers without categories are automatically labeled with the destination account name (e.g., "Transfer: Savings Account") instead of showing as "Uncategorized"
  - **Payees**: Transfer payees are automatically labeled with the destination account name (e.g., "Transfer: Savings Account") instead of showing as "Unknown"
  - Multiple transfers to the same account are grouped together in both categories and payees
- **Off-Budget Filtering**: Excludes off-budget transactions by default. Set `includeOffBudget = true` to include them
- Excludes starting balance transactions (transactions where payee name is "Starting Balance")
- Handles deleted categories/payees (marks with "deleted: " prefix)
- Converts amounts from cents to dollars
- Calculates all derived metrics automatically

## Type Definitions

All TypeScript types are defined in `src/types/index.ts`. Key types include:

### Core Data Types

**`Transaction`**

- Represents a single financial transaction
- Fields: id, account, date, amount, payee, payee_name, category, category_name, notes, cleared, reconciled
- `amount` is stored in cents (negative for expenses, positive for income)

**`Account`**

- Represents a budget account
- Fields: id, name, type, offbudget

**`Category`**

- Represents a budget category
- Fields: id, name, group, is_income, tombstone

**`WrappedData`**

- Main data structure containing all processed budget data
- Includes all calculated metrics, trends, and aggregations
- Used throughout the application to display wrapped pages

### Aggregated Data Types

**`MonthlyData`**: Income, expenses, and net savings per month

**`CategorySpending`**: Total spending per category with percentage

**`PayeeSpending`**: Total spending per payee with transaction count

**`CategoryTrend`**: Monthly spending trends for a category

**`TransactionStats`**: Summary statistics (count, average, largest)

**`CalendarDay`**: Daily transaction count and amount for heatmap

**`SpendingVelocity`**: Daily averages and fastest/slowest spending periods

**`DayOfWeekSpending`**: Spending patterns by day of week

**`AccountBreakdown`**: Spending breakdown by account

**`SpendingStreaks`**: Longest spending and no-spending streaks

**`TransactionSizeDistribution`**: Distribution of transaction amounts by size buckets

**`QuarterlyData`**: Aggregated data by quarter (Q1-Q4)

**`CategoryGrowth`**: Category growth/decline metrics over time

**`SavingsMilestone`**: Milestone achievements for savings thresholds

**`FutureProjection`**: Projected savings and income/expenses for the next year

## Common Usage Patterns

### Loading and Processing Budget Data

```typescript
import { useActualData } from '../hooks/useActualData';

function BudgetViewer() {
  const { data, loading, error, progress, fetchData, retry } = useActualData();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await fetchData(file);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <FileUploadForm onFileSelect={handleFileSelect} />;

  return <WrappedPages data={data} />;
}
```

### Direct File API Usage (Advanced)

```typescript
import {
  initialize,
  getAllTransactionsForYear,
  getCategories,
  getPayees,
  getAccounts,
  shutdown,
  integerToAmount
} from '../services/fileApi';

async function processBudgetFile(file: File) {
  try {
    // Initialize database
    await initialize(file);

    // Fetch data
    const [transactions, categories, payees, accounts] = await Promise.all([
      getAllTransactionsForYear(2025),
      getCategories(),
      getPayees(),
      getAccounts()
    ]);

    // Process transactions
    const expenses = transactions
      .filter(t => t.amount < 0)
      .map(t => ({
        ...t,
        amount: integerToAmount(Math.abs(t.amount))
      }));

    return { expenses, categories, payees, accounts };
  } finally {
    // Cleanup
    await shutdown();
  }
}
```

### Animating Numbers

```typescript
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

function AnimatedStat({ label, value }: { label: string; value: number }) {
  const animated = useAnimatedNumber(value, 1000, 0);

  return (
    <div>
      <div>{label}</div>
      <div className="big-number">{animated.toLocaleString()}</div>
    </div>
  );
}
```

## Error Handling

All fileApi functions throw errors if:

- Database is not initialized (call `initialize()` first)
- Database file is invalid or missing `db.sqlite`
- SQL queries fail

Always wrap fileApi calls in try-catch blocks:

```typescript
try {
  await initialize(file);
  const accounts = await getAccounts();
} catch (error) {
  console.error('Failed to load budget:', error);
  // Handle error appropriately
}
```

The `useActualData` hook automatically handles errors and exposes them via the `error` return value.

## Performance Considerations

- `getAllTransactionsForYear()` loads all transactions for the year - can be slow for large datasets
- `transformToWrappedData()` performs many calculations - consider memoizing if called frequently
- Database initialization (`initialize()`) only needs to happen once per file upload
- Use `shutdown()` to free memory when done with the database

## Browser Compatibility

- Requires browsers with WebAssembly support (all modern browsers)
- Uses `sql.js` which loads WASM files from the public directory (bundled with the app)
- Uses localStorage API for `useLocalStorage` hook
- Uses `requestAnimationFrame` for `useAnimatedNumber` hook
