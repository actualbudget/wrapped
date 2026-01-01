import { useState, useEffect, useCallback } from "react";

import type { WrappedData } from "../types";

import {
  initialize,
  getAllTransactionsForYear,
  getCategories,
  getPayees,
  getAccounts,
  shutdown,
  clearBudget,
} from "../services/fileApi";
import { getErrorMessage, isFileApiError } from "../types/errors";
import { DEFAULT_YEAR } from "../utils/constants";
import { transformToWrappedData } from "../utils/dataTransform";

export function useActualData() {
  const [data, setData] = useState<WrappedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const fetchData = useCallback(async (uploadedFile: File) => {
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

      // Transform data
      setProgress(85);
      const wrappedData = transformToWrappedData(
        transactions,
        categories,
        payees,
        accounts,
        DEFAULT_YEAR,
      );

      setData(wrappedData);
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
  }, []);

  const refreshData = useCallback(async () => {
    if (!file) {
      throw new Error("No file available");
    }
    await fetchData(file);
  }, [file, fetchData]);

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
    retry,
  };
}
