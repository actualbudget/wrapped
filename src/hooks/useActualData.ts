import { useState, useEffect, useCallback } from 'react';

import type { WrappedData } from '../types';

import {
  initialize,
  getAllTransactionsForYear,
  getCategories,
  getPayees,
  getAccounts,
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const transformData = useCallback((raw: RawBudgetData, includeOffBudget: boolean) => {
    const wrappedData = transformToWrappedData(
      raw.transactions,
      raw.categories,
      raw.payees,
      raw.accounts,
      DEFAULT_YEAR,
      includeOffBudget,
    );
    setData(wrappedData);
  }, []);

  const fetchData = useCallback(
    async (uploadedFile: File, includeOffBudget: boolean = false) => {
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
        setProgress(70);
        const categories = await getCategories();
        const payees = await getPayees();
        const accounts = await getAccounts();

        const raw = { transactions, categories, payees, accounts };
        setRawData(raw);

        // Transform data
        setProgress(85);
        transformData(raw, includeOffBudget);

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
    async (includeOffBudget: boolean = false) => {
      if (!file) {
        throw new Error('No file available');
      }
      await fetchData(file, includeOffBudget);
    },
    [file, fetchData],
  );

  const retransformData = useCallback(
    (includeOffBudget: boolean) => {
      if (rawData) {
        transformData(rawData, includeOffBudget);
      }
    },
    [rawData, transformData],
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
