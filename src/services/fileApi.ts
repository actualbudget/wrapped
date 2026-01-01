import JSZip from "jszip";
import type { Transaction, Account, Category } from "../types";

type SqlJsDatabase = Awaited<ReturnType<typeof import("sql.js").default>>["Database"];

let sqlJs: Awaited<ReturnType<typeof import("sql.js").default>> | null = null;
let db: InstanceType<SqlJsDatabase> | null = null; // sql.js Database instance

/**
 * Initialize sql.js
 */
async function initSqlJsLib(): Promise<Awaited<ReturnType<typeof import("sql.js").default>>> {
  if (sqlJs) {
    return sqlJs;
  }

  console.log("Initializing sql.js...");

  // Dynamically import sql.js
  const sqlJsModule = await import("sql.js");

  // The default export is the initSqlJs function
  const initFn = sqlJsModule.default;

  if (typeof initFn !== "function") {
    throw new Error(
      `Failed to load sql.js: default export is not a function. Got type: ${typeof initFn}`,
    );
  }

  // Load sql.js - initSqlJs returns a Promise that resolves to the Module
  sqlJs = await initFn({
    locateFile: (file: string) => {
      // Use CDN for sql-wasm.wasm file
      return `https://sql.js.org/dist/${file}`;
    },
  });

  console.log("sql.js initialized");
  return sqlJs;
}

/**
 * Initialize the file API by loading a zip file
 */
export async function initialize(file: File): Promise<void> {
  try {
    // Close existing database if any
    if (db) {
      db.close();
      db = null;
    }

    // Load and unzip the file
    console.log("Loading zip file...");
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Extract db.sqlite
    const dbFile = zip.file("db.sqlite");
    if (!dbFile) {
      throw new Error("db.sqlite not found in zip file");
    }

    const dbData = await dbFile.async("uint8array");
    console.log("Extracted db.sqlite from zip");

    // Load the database into sql.js
    const SQL = await initSqlJsLib();
    db = new SQL.Database(dbData);
    console.log("Database loaded");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to initialize file API: ${errorMessage}`);
  }
}

/**
 * Execute a query on the database
 */
function query(sql: string, params: unknown[] = []): Record<string, unknown>[] {
  if (!db) {
    throw new Error("Database not loaded. Call initialize() first.");
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
    throw new Error("Database not loaded. Call initialize() first.");
  }

  try {
    const accounts = query("SELECT id, name, type, offbudget FROM accounts WHERE tombstone = 0");
    return accounts.map((acc) => ({
      id: String(acc.id),
      name: String(acc.name),
      type: String(acc.type),
      offbudget: acc.offbudget === 1,
    }));
  } catch (error) {
    console.error("Failed to get accounts:", error);
    throw error;
  }
}

/**
 * Get categories from database
 */
export async function getCategories(): Promise<Category[]> {
  if (!db) {
    throw new Error("Database not loaded. Call initialize() first.");
  }

  try {
    // Categories table uses 'cat_group' column (not 'group_id')
    // Fetch both active and deleted categories
    const categories = query("SELECT id, name, is_income, cat_group, tombstone FROM categories");

    // Get category groups
    let groupMap = new Map<string, string>();
    try {
      const groups = query("SELECT id, name FROM category_groups WHERE tombstone = 0");
      groupMap = new Map(groups.map((g) => [String(g.id), String(g.name)]));
    } catch {
      // No category_groups table, that's okay
    }

    return categories.map((cat) => ({
      id: String(cat.id),
      name: String(cat.name),
      group: cat.cat_group ? groupMap.get(String(cat.cat_group)) : undefined,
      is_income: cat.is_income === 1,
      tombstone: cat.tombstone === 1, // Include tombstone flag
    }));
  } catch (error) {
    console.error("Failed to get categories:", error);
    throw error;
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
    throw new Error("Database not loaded. Call initialize() first.");
  }

  try {
    // Based on the schema:
    // - transactions.date is INTEGER in YYYYMMDD format (e.g., 20250603)
    // - transactions.description is a UUID that maps to payees via payee_mapping
    // - payee_mapping.id = transactions.description, payee_mapping.targetId = payees.id

    // Convert date strings to YYYYMMDD integer format for comparison
    let dateFilter = "";
    const params: unknown[] = [accountId];

    if (startDate) {
      // Convert YYYY-MM-DD to YYYYMMDD integer
      const startDateInt = parseInt(startDate.replace(/-/g, ""), 10);
      dateFilter += " AND date >= ?";
      params.push(startDateInt);
    }

    if (endDate) {
      // Convert YYYY-MM-DD to YYYYMMDD integer
      const endDateInt = parseInt(endDate.replace(/-/g, ""), 10);
      dateFilter += " AND date <= ?";
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
      const payees = query("SELECT id, name, tombstone FROM payees");
      payeeInfoMap = new Map(
        payees.map((p) => [String(p.id), { name: String(p.name), tombstone: p.tombstone === 1 }]),
      );
      payeeMap = new Map(payees.map((p) => [String(p.id), String(p.name)]));

      // Get payee mappings: description UUID -> payee ID
      const payeeMappings = query("SELECT id, targetId FROM payee_mapping");
      payeeMappings.forEach((pm) => {
        descriptionToPayeeMap.set(String(pm.id), String(pm.targetId));
      });
    } catch (error) {
      console.warn("Could not load payees:", error);
    }

    // Get category names (including deleted ones)
    const categories = query("SELECT id, name, tombstone FROM categories");
    const categoryMap = new Map(
      categories.map((c) => [String(c.id), { name: String(c.name), tombstone: c.tombstone === 1 }]),
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
    console.error("Failed to get transactions:", error);
    throw error;
  }
}

/**
 * Get all transactions for a year across all accounts
 */
export async function getAllTransactionsForYear(year: number): Promise<Transaction[]> {
  if (!db) {
    throw new Error("Database not loaded. Call initialize() first.");
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
      } catch (error) {
        console.warn(`Failed to fetch transactions for account ${account.name}:`, error);
      }
    }

    return allTransactions;
  } catch (error) {
    console.error("Failed to get all transactions:", error);
    throw error;
  }
}

/**
 * Get payees from database
 */
export async function getPayees(): Promise<
  Array<{ id: string; name: string; tombstone?: boolean; transfer_acct?: string }>
> {
  if (!db) {
    throw new Error("Database not loaded. Call initialize() first.");
  }

  try {
    // Fetch both active and deleted payees, including transfer_acct field
    const payees = query("SELECT id, name, tombstone, transfer_acct FROM payees");
    return payees.map((p) => ({
      id: String(p.id),
      name: String(p.name),
      tombstone: p.tombstone === 1, // Include tombstone flag
      transfer_acct: p.transfer_acct ? String(p.transfer_acct) : undefined, // Include transfer_acct if present
    }));
  } catch (error) {
    console.error("Failed to get payees:", error);
    throw error;
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
 * Utility functions for amount conversion
 */
export function integerToAmount(amount: number): number {
  return amount / 100;
}
