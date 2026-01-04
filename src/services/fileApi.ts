import JSZip from 'jszip';

import type { Transaction, Account, Category } from '../types';

import {
  DatabaseError,
  FileValidationError,
  getErrorMessage,
  isFileApiError,
} from '../types/errors';
import { MAX_FILE_SIZE } from '../utils/constants';
import { getCurrencySymbolFromCode } from '../utils/currency';

type SqlJsDatabase = Awaited<ReturnType<typeof import('sql.js').default>>['Database'];

let sqlJs: Awaited<ReturnType<typeof import('sql.js').default>> | null = null;
let db: InstanceType<SqlJsDatabase> | null = null; // sql.js Database instance

/**
 * Initialize sql.js
 */
async function initSqlJsLib(): Promise<Awaited<ReturnType<typeof import('sql.js').default>>> {
  if (sqlJs) {
    return sqlJs;
  }

  console.log('Initializing sql.js...');

  // Dynamically import sql.js
  const sqlJsModule = await import('sql.js');

  // The default export is the initSqlJs function
  const initFn = sqlJsModule.default;

  if (typeof initFn !== 'function') {
    throw new DatabaseError(
      `Failed to load sql.js: default export is not a function. Got type: ${typeof initFn}`,
    );
  }

  // Load sql.js - initSqlJs returns a Promise that resolves to the Module
  // Use bundled WASM files from public directory instead of CDN for security
  sqlJs = await initFn({
    locateFile: (file: string) => {
      // WASM files are copied to public directory during build
      return `/${file}`;
    },
  });

  console.log('sql.js initialized');
  return sqlJs;
}

/**
 * Initialize the file API by loading a zip file
 */
export async function initialize(file: File): Promise<void> {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new FileValidationError(
        `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${MAX_FILE_SIZE / 1024 / 1024}MB)`,
      );
    }

    if (file.size === 0) {
      throw new FileValidationError('File is empty');
    }

    // Close existing database if any
    if (db) {
      db.close();
      db = null;
    }

    // Load and unzip the file
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Extract db.sqlite
    const dbFile = zip.file('db.sqlite');
    if (!dbFile) {
      throw new FileValidationError('db.sqlite not found in zip file');
    }

    const dbData = await dbFile.async('uint8array');
    if (dbData.length === 0) {
      throw new FileValidationError('db.sqlite file is empty');
    }

    // Load the database into sql.js
    const SQL = await initSqlJsLib();
    db = new SQL.Database(dbData);
  } catch (error) {
    if (isFileApiError(error)) {
      throw error;
    }
    const errorMessage = getErrorMessage(error);
    throw new DatabaseError(`Failed to initialize file API: ${errorMessage}`, error);
  }
}

/**
 * Execute a query on the database
 */
function query(sql: string, params: unknown[] = []): Record<string, unknown>[] {
  if (!db) {
    throw new DatabaseError('Database not loaded. Call initialize() first.');
  }

  const stmt = db.prepare(sql);
  stmt.bind(params);

  const results: Record<string, unknown>[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row);
  }

  stmt.free();
  return results;
}

/**
 * Get accounts from database
 */
export async function getAccounts(): Promise<Account[]> {
  if (!db) {
    throw new DatabaseError('Database not loaded. Call initialize() first.');
  }

  try {
    const accounts = query('SELECT id, name, type, offbudget FROM accounts WHERE tombstone = 0');
    return accounts.map(acc => ({
      id: String(acc.id),
      name: String(acc.name),
      type: String(acc.type),
      offbudget: acc.offbudget === 1,
    }));
  } catch (error) {
    if (isFileApiError(error)) {
      throw error;
    }
    throw new DatabaseError('Failed to get accounts', error);
  }
}

/**
 * Get category group sort orders (group name -> sort_order)
 */
export async function getCategoryGroupSortOrders(): Promise<Map<string, number>> {
  if (!db) {
    throw new DatabaseError('Database not loaded. Call initialize() first.');
  }

  const groupSortOrderMap = new Map<string, number>();
  try {
    const groups = query('SELECT id, name, sort_order FROM category_groups WHERE tombstone = 0');
    groups.forEach(g => {
      const name = String(g.name);
      if (g.sort_order !== null && g.sort_order !== undefined) {
        groupSortOrderMap.set(name, Number(g.sort_order));
      }
    });
  } catch {
    // No category_groups table or sort_order column, that's okay
  }
  return groupSortOrderMap;
}

/**
 * Get category group tombstone status (group name -> tombstone boolean)
 */
export async function getCategoryGroupTombstones(): Promise<Map<string, boolean>> {
  if (!db) {
    throw new DatabaseError('Database not loaded. Call initialize() first.');
  }

  const groupTombstoneMap = new Map<string, boolean>();
  try {
    const groups = query('SELECT id, name, tombstone FROM category_groups');
    groups.forEach(g => {
      const name = String(g.name);
      groupTombstoneMap.set(name, (g.tombstone as number) === 1);
    });
  } catch {
    // No category_groups table, that's okay
  }
  return groupTombstoneMap;
}

/**
 * Get categories from database
 */
export async function getCategories(): Promise<Category[]> {
  if (!db) {
    throw new DatabaseError('Database not loaded. Call initialize() first.');
  }

  try {
    // Categories table uses 'cat_group' column (not 'group_id')
    // Fetch both active and deleted categories
    const categories = query('SELECT id, name, is_income, cat_group, tombstone FROM categories');

    // Get category groups (including deleted ones to properly map categories)
    let groupMap = new Map<string, string>();
    try {
      const groups = query('SELECT id, name FROM category_groups');
      groupMap = new Map(groups.map(g => [String(g.id), String(g.name)]));
    } catch {
      // No category_groups table, that's okay
    }

    return categories.map(cat => ({
      id: String(cat.id),
      name: String(cat.name),
      group: cat.cat_group ? groupMap.get(String(cat.cat_group)) : undefined,
      is_income: cat.is_income === 1,
      tombstone: cat.tombstone === 1, // Include tombstone flag
    }));
  } catch (error) {
    if (isFileApiError(error)) {
      throw error;
    }
    throw new DatabaseError('Failed to get categories', error);
  }
}

/**
 * Get transactions from database
 */
async function getTransactions(
  accountId: string,
  startDate?: string,
  endDate?: string,
): Promise<Transaction[]> {
  if (!db) {
    throw new DatabaseError('Database not loaded. Call initialize() first.');
  }

  try {
    // Based on the schema:
    // - transactions.date is INTEGER in YYYYMMDD format (e.g., 20250603)
    // - transactions.description is a UUID that maps to payees via payee_mapping
    // - payee_mapping.id = transactions.description, payee_mapping.targetId = payees.id

    // Convert date strings to YYYYMMDD integer format for comparison
    let dateFilter = '';
    const params: unknown[] = [accountId];

    if (startDate) {
      // Convert YYYY-MM-DD to YYYYMMDD integer
      const startDateInt = parseInt(startDate.replace(/-/g, ''), 10);
      dateFilter += ' AND date >= ?';
      params.push(startDateInt);
    }

    if (endDate) {
      // Convert YYYY-MM-DD to YYYYMMDD integer
      const endDateInt = parseInt(endDate.replace(/-/g, ''), 10);
      dateFilter += ' AND date <= ?';
      params.push(endDateInt);
    }

    let sql = `SELECT id, acct as account, date, amount, category, notes, description, cleared, reconciled FROM transactions WHERE acct = ? AND tombstone = 0${dateFilter}`;
    const transactions = query(sql, params);

    // Get payee information - payees are linked via payee_mapping table
    // payee_mapping.id = transactions.description, payee_mapping.targetId = payees.id
    let payeeMap = new Map<string, string>(); // payee_id -> payee_name
    let payeeInfoMap = new Map<string, { name: string; tombstone: boolean }>(); // payee_id -> payee info
    let descriptionToPayeeMap = new Map<string, string>(); // description (UUID) -> payee_id

    try {
      // Get all payees (including deleted ones)
      const payees = query('SELECT id, name, tombstone FROM payees');
      payeeInfoMap = new Map(
        payees.map(p => [String(p.id), { name: String(p.name), tombstone: p.tombstone === 1 }]),
      );
      payeeMap = new Map(payees.map(p => [String(p.id), String(p.name)]));

      // Get payee mappings: description UUID -> payee ID
      const payeeMappings = query('SELECT id, targetId FROM payee_mapping');
      payeeMappings.forEach(pm => {
        descriptionToPayeeMap.set(String(pm.id), String(pm.targetId));
      });
    } catch {
      // Payee loading failure is non-critical, continue without payee info
      // Error is silently handled as transactions can work without payee names
    }

    // Get category names (including deleted ones)
    const categories = query('SELECT id, name, tombstone FROM categories');
    const categoryMap = new Map(
      categories.map(c => [String(c.id), { name: String(c.name), tombstone: c.tombstone === 1 }]),
    );

    const result: Transaction[] = [];

    for (const t of transactions) {
      // Convert date from YYYYMMDD integer to YYYY-MM-DD string
      const dateStr = t.date
        ? `${String(t.date).slice(0, 4)}-${String(t.date).slice(4, 6)}-${String(t.date).slice(6, 8)}`
        : undefined;

      // Skip transactions without dates
      if (!dateStr) {
        continue;
      }

      // Find payee: description (UUID) -> payee_mapping -> payee
      const payeeId = t.description ? descriptionToPayeeMap.get(String(t.description)) : undefined;
      const payeeName = payeeId ? payeeMap.get(payeeId) : undefined;
      const payeeInfo = payeeId && payeeInfoMap ? payeeInfoMap.get(payeeId) : undefined;
      const payeeTombstone = payeeInfo ? payeeInfo.tombstone : false;

      // Get category info (name and tombstone status)
      const categoryInfo = t.category ? categoryMap.get(String(t.category)) : undefined;
      const categoryName = categoryInfo ? categoryInfo.name : undefined;
      const categoryTombstone = categoryInfo ? categoryInfo.tombstone : false;

      result.push({
        id: String(t.id),
        account: t.account ? String(t.account) : accountId,
        date: dateStr,
        amount: Number(t.amount),
        payee: payeeId || undefined,
        payee_name: payeeName,
        payee_tombstone: payeeTombstone,
        notes: t.notes ? String(t.notes) : undefined,
        category: t.category ? String(t.category) : undefined,
        category_name: categoryName,
        category_tombstone: categoryTombstone,
        cleared: t.cleared === 1 || false,
        reconciled: t.reconciled === 1 || false,
      });
    }

    return result;
  } catch (error) {
    if (isFileApiError(error)) {
      throw error;
    }
    throw new DatabaseError('Failed to get transactions', error);
  }
}

/**
 * Get all transactions for a year across all accounts
 */
export async function getAllTransactionsForYear(year: number): Promise<Transaction[]> {
  if (!db) {
    throw new DatabaseError('Database not loaded. Call initialize() first.');
  }

  try {
    const accounts = await getAccounts();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const allTransactions: Transaction[] = [];

    for (const account of accounts) {
      try {
        const transactions = await getTransactions(account.id, startDate, endDate);
        allTransactions.push(...transactions);
      } catch {
        // Individual account failures are non-critical, continue with other accounts
        // Error is logged but not thrown to allow partial data retrieval
      }
    }

    return allTransactions;
  } catch (error) {
    if (isFileApiError(error)) {
      throw error;
    }
    throw new DatabaseError('Failed to get all transactions', error);
  }
}

/**
 * Get payees from database
 */
export async function getPayees(): Promise<
  Array<{ id: string; name: string; tombstone?: boolean; transfer_acct?: string }>
> {
  if (!db) {
    throw new DatabaseError('Database not loaded. Call initialize() first.');
  }

  try {
    // Fetch both active and deleted payees, including transfer_acct field
    const payees = query('SELECT id, name, tombstone, transfer_acct FROM payees');
    return payees.map(p => ({
      id: String(p.id),
      name: String(p.name),
      tombstone: p.tombstone === 1, // Include tombstone flag
      transfer_acct: p.transfer_acct ? String(p.transfer_acct) : undefined, // Include transfer_acct if present
    }));
  } catch (error) {
    if (isFileApiError(error)) {
      throw error;
    }
    throw new DatabaseError('Failed to get payees', error);
  }
}

/**
 * Shutdown and cleanup
 */
export async function shutdown(): Promise<void> {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Clear budget data
 */
export async function clearBudget(): Promise<void> {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Get budgeted amounts from database
 * Queries the zero_budgets table directly (schema is known)
 */
export async function getBudgetedAmounts(
  year: number,
): Promise<Array<{ categoryId: string; month: string; budgetedAmount: number }>> {
  if (!db) {
    throw new DatabaseError('Database not loaded. Call initialize() first.');
  }

  try {
    // Actual Budget uses zero_budgets table with:
    // - month: INTEGER in YYYYMM format (e.g., 202501 for January 2025)
    // - category: TEXT (UUID matching category IDs)
    // - amount: INTEGER (budgeted amount in cents)
    const yearStart = year * 100 + 1; // e.g., 202501
    const yearEnd = year * 100 + 12; // e.g., 202512

    // Query zero_budgets table directly with parameterized query
    const sql = 'SELECT month, category, amount FROM zero_budgets WHERE month >= ? AND month <= ?';
    const budgetRows = query(sql, [yearStart, yearEnd]);

    // Month names for conversion
    const monthNames = [
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

    // Convert to structured format
    const result: Array<{ categoryId: string; month: string; budgetedAmount: number }> = [];

    for (const row of budgetRows) {
      const categoryId = String(row.category || '');
      const monthInt = Number(row.month || 0);
      const amount = Number(row.amount || 0);

      // Skip if missing required data
      if (!categoryId || !monthInt || amount === 0) {
        continue;
      }

      // Convert month INTEGER (YYYYMM format) to month name
      // Extract month number from YYYYMM (e.g., 202501 -> 01 -> January)
      const monthNum = monthInt % 100; // Get last 2 digits
      if (monthNum < 1 || monthNum > 12) {
        continue; // Skip invalid month numbers
      }

      const monthStr = monthNames[monthNum - 1];
      const budgetedAmount = integerToAmount(amount);

      result.push({
        categoryId,
        month: monthStr,
        budgetedAmount,
      });
    }

    return result;
  } catch (error) {
    // If budget data fetch fails (e.g., table doesn't exist), return empty array
    // This allows graceful degradation - the page will show "No budget data available"
    console.warn('Failed to fetch budget data:', error);
    return [];
  }
}

/**
 * Get currency symbol from preferences table
 * Queries the preferences table for defaultCurrencyCode and maps it to a symbol
 */
export async function getCurrencySymbol(): Promise<string> {
  if (!db) {
    throw new DatabaseError('Database not loaded. Call initialize() first.');
  }

  try {
    // Query preferences table for defaultCurrencyCode
    const results = query("SELECT value FROM preferences WHERE id = 'defaultCurrencyCode'");

    let currencyCode: string | null = null;
    if (results.length > 0 && results[0].value) {
      currencyCode = String(results[0].value).trim();
      // If empty string, treat as null
      if (currencyCode === '') {
        currencyCode = null;
      }
    }

    // Map currency code to symbol using the utility function
    return getCurrencySymbolFromCode(currencyCode);
  } catch (error) {
    // If preferences table doesn't exist or query fails, default to "$"
    console.warn('Failed to fetch currency symbol from preferences, defaulting to $:', error);
    return '$';
  }
}

/**
 * Utility functions for amount conversion
 */
export function integerToAmount(amount: number): number {
  return amount / 100;
}
