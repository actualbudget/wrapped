import { useState, useEffect, useCallback } from 'react';

import type { WrappedData } from '../types';

import {
  initialize,
  getAllTransactionsForYear,
  getCategories,
  getPayees,
  getAccounts,
  getBudgetedAmounts,
  getCategoryGroupSortOrders,
  getCategoryGroupTombstones,
  getCurrencySymbol,
  shutdown,
  clearBudget,
} from '../services/fileApi';
import { getErrorMessage, isFileApiError } from '../types/errors';
import { DEFAULT_YEAR } from '../utils/constants';
import { transformToWrappedData } from '../utils/dataTransform';

interface RawBudgetData {
  transactions: Awaited<ReturnType<typeof getAllTransactionsForYear>>;
  categories: Awaited<ReturnType<typeof getCategories>>;
  payees: Awaited<ReturnType<typeof getPayees>>;
  accounts: Awaited<ReturnType<typeof getAccounts>>;
}

export function useActualData() {
  const [data, setData] = useState<WrappedData | null>(null);
  const [rawData, setRawData] = useState<RawBudgetData | null>(null);
  const [budgetData, setBudgetData] = useState<
    Array<{ categoryId: string; month: string; budgetedAmount: number }> | undefined
  >(undefined);
  const [groupSortOrders, setGroupSortOrders] = useState<Map<string, number>>(new Map());
  const [groupTombstones, setGroupTombstones] = useState<Map<string, boolean>>(new Map());
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const transformData = useCallback(
    (
      raw: RawBudgetData,
      includeOffBudget: boolean,
      includeOnBudgetTransfers: boolean,
      includeAllTransfers: boolean,
      currencySymbol: string,
      budgetData?: Array<{ categoryId: string; month: string; budgetedAmount: number }>,
      groupSortOrders: Map<string, number> = new Map(),
      groupTombstones: Map<string, boolean> = new Map(),
      includeIncomeInCategories: boolean = true, // Default to true (new net calculation mode)
    ) => {
      const wrappedData = transformToWrappedData(
        raw.transactions,
        raw.categories,
        raw.payees,
        raw.accounts,
        DEFAULT_YEAR,
        includeOffBudget,
        includeOnBudgetTransfers,
        includeAllTransfers,
        currencySymbol,
        budgetData,
        groupSortOrders,
        groupTombstones,
        includeIncomeInCategories,
      );
      setData(wrappedData);
    },
    [],
  );

  const fetchData = useCallback(
    async (
      uploadedFile: File,
      includeOffBudget: boolean = false,
      includeOnBudgetTransfers: boolean = true, // Default to true (on by default)
      includeAllTransfers: boolean = false,
      overrideCurrencySymbol?: string,
      includeIncomeInCategories: boolean = true, // Default to true (new net calculation mode)
    ) => {
      setLoading(true);
      setError(null);
      setFile(uploadedFile);
      setProgress(0);

      try {
        // Clear old database before initializing new file to ensure fresh data
        setProgress(10);
        await clearBudget();

        // Initialize file API (loads and parses the zip file)
        setProgress(30);
        await initialize(uploadedFile);

        // Fetch all data
        setProgress(50);
        const transactions = await getAllTransactionsForYear(DEFAULT_YEAR);
        setProgress(60);
        const categories = await getCategories();
        const payees = await getPayees();
        const accounts = await getAccounts();
        setProgress(70);

        const raw = { transactions, categories, payees, accounts };
        setRawData(raw);

        // Fetch currency symbol
        setProgress(72);
        let currencySymbol = '$';
        try {
          currencySymbol = await getCurrencySymbol();
        } catch (error) {
          // Currency symbol fetch failed, default to "$"
          console.warn('Failed to fetch currency symbol, defaulting to $:', error);
        }

        // Fetch budget data and group sort orders (non-blocking - returns empty array/map if unavailable)
        let fetchedBudgetData: Array<{
          categoryId: string;
          month: string;
          budgetedAmount: number;
        }> = [];
        let fetchedGroupSortOrders = new Map<string, number>();
        let fetchedGroupTombstones = new Map<string, boolean>();
        try {
          fetchedBudgetData = await getBudgetedAmounts(DEFAULT_YEAR);
          fetchedGroupSortOrders = await getCategoryGroupSortOrders();
          fetchedGroupTombstones = await getCategoryGroupTombstones();
        } catch (error) {
          // Budget data or group sort order fetch failed, continue without it
          console.warn('Failed to fetch budget data or group sort orders:', error);
        }

        // Store budget data, group sort orders, and currency symbol for retransformData
        setBudgetData(fetchedBudgetData.length > 0 ? fetchedBudgetData : undefined);
        setGroupSortOrders(fetchedGroupSortOrders);
        setGroupTombstones(fetchedGroupTombstones);
        setCurrencySymbol(currencySymbol);

        // Use override currency if provided, otherwise use the currency from the database
        const effectiveCurrency = overrideCurrencySymbol || currencySymbol;

        // Transform data
        setProgress(85);
        transformData(
          raw,
          includeOffBudget,
          includeOnBudgetTransfers,
          includeAllTransfers,
          effectiveCurrency,
          fetchedBudgetData.length > 0 ? fetchedBudgetData : undefined,
          fetchedGroupSortOrders,
          fetchedGroupTombstones,
          includeIncomeInCategories,
        );

        setProgress(100);
        setLoading(false);
      } catch (err) {
        let errorMessage: string;
        if (isFileApiError(err)) {
          errorMessage = err.message;
        } else {
          errorMessage = getErrorMessage(err);
        }
        setError(errorMessage);
        setLoading(false);
        setProgress(0);
      }
    },
    [transformData],
  );

  const refreshData = useCallback(
    async (
      includeOffBudget: boolean = false,
      includeOnBudgetTransfers: boolean = true, // Default to true (on by default)
      includeAllTransfers: boolean = false,
      overrideCurrencySymbol?: string,
      includeIncomeInCategories: boolean = true, // Default to true (new net calculation mode)
    ) => {
      if (!file) {
        throw new Error('No file available');
      }
      await fetchData(
        file,
        includeOffBudget,
        includeOnBudgetTransfers,
        includeAllTransfers,
        overrideCurrencySymbol,
        includeIncomeInCategories,
      );
    },
    [file, fetchData],
  );

  const retransformData = useCallback(
    (
      includeOffBudget: boolean,
      includeOnBudgetTransfers: boolean,
      includeAllTransfers: boolean,
      overrideCurrencySymbol?: string,
      includeIncomeInCategories: boolean = true, // Default to true (new net calculation mode)
    ) => {
      if (rawData) {
        const effectiveCurrency = overrideCurrencySymbol || currencySymbol;
        transformData(
          rawData,
          includeOffBudget,
          includeOnBudgetTransfers,
          includeAllTransfers,
          effectiveCurrency,
          budgetData,
          groupSortOrders,
          groupTombstones,
          includeIncomeInCategories,
        );
      }
    },
    [rawData, transformData, currencySymbol, budgetData, groupSortOrders, groupTombstones],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shutdown().catch(console.error);
    };
  }, []);

  const retry = useCallback(() => {
    if (file) {
      return fetchData(file);
    }
  }, [file, fetchData]);

  return {
    data,
    loading,
    error,
    progress,
    fetchData,
    refreshData,
    retransformData,
    retry,
  };
}
