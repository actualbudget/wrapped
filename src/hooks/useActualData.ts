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
import { transformToWrappedData } from "../utils/dataTransform";

export function useActualData() {
  const [data, setData] = useState<WrappedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const fetchData = useCallback(async (uploadedFile: File) => {
    setLoading(true);
    setError(null);
    setFile(uploadedFile);

    try {
      // Clear old database before initializing new file to ensure fresh data
      await clearBudget();

      // Initialize file API (loads and parses the zip file)
      await initialize(uploadedFile);

      // Fetch all data
      const transactions = await getAllTransactionsForYear(2025);
      const categories = await getCategories();
      const payees = await getPayees();
      const accounts = await getAccounts();

      // Transform data
      const wrappedData = transformToWrappedData(transactions, categories, payees, accounts);

      setData(wrappedData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      setLoading(false);
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

  return {
    data,
    loading,
    error,
    fetchData,
    refreshData,
  };
}
