import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { createMockWrappedData } from "../test-utils/mockData";
import { useActualData } from "./useActualData";

// Mock the fileApi module
const mockInitialize = vi.fn();
const mockGetAllTransactionsForYear = vi.fn();
const mockGetCategories = vi.fn();
const mockGetPayees = vi.fn();
const mockGetAccounts = vi.fn();
const mockShutdown = vi.fn(() => Promise.resolve());
const mockClearBudget = vi.fn();

vi.mock("../services/fileApi", () => ({
  initialize: (file: File) => mockInitialize(file),
  getAllTransactionsForYear: (year: number) => mockGetAllTransactionsForYear(year),
  getCategories: () => mockGetCategories(),
  getPayees: () => mockGetPayees(),
  getAccounts: () => mockGetAccounts(),
  shutdown: () => mockShutdown(),
  clearBudget: () => mockClearBudget(),
}));

// Mock transformToWrappedData
const mockTransformToWrappedData = vi.fn();
vi.mock("../utils/dataTransform", () => ({
  transformToWrappedData: (
    transactions: unknown[],
    categories: unknown[],
    payees: unknown[],
    accounts: unknown[],
  ) => mockTransformToWrappedData(transactions, categories, payees, accounts),
}));

describe("useActualData", () => {
  const createMockFile = (): File => {
    return new File(["test content"], "test.zip", { type: "application/zip" });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockInitialize.mockResolvedValue(undefined);
    mockGetAllTransactionsForYear.mockResolvedValue([]);
    mockGetCategories.mockResolvedValue([]);
    mockGetPayees.mockResolvedValue([]);
    mockGetAccounts.mockResolvedValue([]);
    // mockShutdown already returns a promise from the mock definition
    mockClearBudget.mockResolvedValue(undefined);
    mockTransformToWrappedData.mockReturnValue(createMockWrappedData());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial State", () => {
    it("starts with null data", () => {
      const { result } = renderHook(() => useActualData());

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("fetchData", () => {
    it("sets loading to true when fetching", async () => {
      const { result } = renderHook(() => useActualData());
      const file = createMockFile();

      // Make the async operations take some time to ensure loading state is visible
      let resolveClearBudget: () => void;
      const clearBudgetPromise = new Promise<void>((resolve) => {
        resolveClearBudget = resolve;
      });
      mockClearBudget.mockReturnValue(clearBudgetPromise);

      // Start fetch (don't await)
      let fetchPromise: Promise<void>;
      await act(async () => {
        fetchPromise = result.current.fetchData(file);
      });

      // Loading should be true after state update
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Resolve the promise to allow completion
      resolveClearBudget!();

      // Wait for completion
      await act(async () => {
        await fetchPromise!;
      });
      expect(result.current.loading).toBe(false);
    });

    it("fetches and transforms data successfully", async () => {
      const { result } = renderHook(() => useActualData());
      const file = createMockFile();
      const mockData = createMockWrappedData();
      mockTransformToWrappedData.mockReturnValue(mockData);

      await result.current.fetchData(file);

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it("calls clearBudget and initialize", async () => {
      const { result } = renderHook(() => useActualData());
      const file = createMockFile();

      await result.current.fetchData(file);

      expect(mockClearBudget).toHaveBeenCalled();
      expect(mockInitialize).toHaveBeenCalled();
    });

    it("calls initialize with file", async () => {
      const { result } = renderHook(() => useActualData());
      const file = createMockFile();

      await result.current.fetchData(file);

      expect(mockInitialize).toHaveBeenCalled();
    });

    it("fetches all required data", async () => {
      const { result } = renderHook(() => useActualData());
      const file = createMockFile();

      await result.current.fetchData(file);

      expect(mockGetAllTransactionsForYear).toHaveBeenCalledWith(2025);
      expect(mockGetCategories).toHaveBeenCalled();
      expect(mockGetPayees).toHaveBeenCalled();
      expect(mockGetAccounts).toHaveBeenCalled();
    });

    it("transforms data with fetched values", async () => {
      const { result } = renderHook(() => useActualData());
      const file = createMockFile();
      const mockTransactions = [{ id: "t1", account: "acc1", date: "2025-01-01", amount: -10000 }];
      const mockCategories = [{ id: "cat1", name: "Test" }];
      const mockPayees = [{ id: "payee1", name: "Payee" }];
      const mockAccounts = [{ id: "acc1", name: "Account", type: "checking" }];

      mockGetAllTransactionsForYear.mockResolvedValue(mockTransactions);
      mockGetCategories.mockResolvedValue(mockCategories);
      mockGetPayees.mockResolvedValue(mockPayees);
      mockGetAccounts.mockResolvedValue(mockAccounts);

      await result.current.fetchData(file);

      expect(mockTransformToWrappedData).toHaveBeenCalledWith(
        mockTransactions,
        mockCategories,
        mockPayees,
        mockAccounts,
      );
    });

    it("handles errors during fetch", async () => {
      const { result } = renderHook(() => useActualData());
      const file = createMockFile();
      const errorMessage = "Failed to load file";
      mockInitialize.mockRejectedValue(new Error(errorMessage));

      await result.current.fetchData(file);

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.loading).toBe(false);
        expect(result.current.data).toBeNull();
      });
    });

    it("handles errors during data fetching", async () => {
      const { result } = renderHook(() => useActualData());
      const file = createMockFile();
      const errorMessage = "Failed to get transactions";
      mockGetAllTransactionsForYear.mockRejectedValue(new Error(errorMessage));

      await result.current.fetchData(file);

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.loading).toBe(false);
      });
    });

    it("handles non-Error exceptions", async () => {
      const { result } = renderHook(() => useActualData());
      const file = createMockFile();
      mockInitialize.mockRejectedValue("String error");

      await result.current.fetchData(file);

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to fetch data");
        expect(result.current.loading).toBe(false);
      });
    });

    it("stores file reference", async () => {
      const { result } = renderHook(() => useActualData());
      const file = createMockFile();

      await result.current.fetchData(file);

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      // File is stored internally, we can verify by calling refreshData
      await expect(result.current.refreshData()).resolves.not.toThrow();
    });
  });

  describe("refreshData", () => {
    it("refreshes data using stored file", async () => {
      const { result } = renderHook(() => useActualData());
      const file = createMockFile();

      await result.current.fetchData(file);

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      vi.clearAllMocks();

      await result.current.refreshData();

      expect(mockInitialize).toHaveBeenCalled();
      expect(mockGetAllTransactionsForYear).toHaveBeenCalled();
    });

    it("throws error if no file available", async () => {
      const { result } = renderHook(() => useActualData());

      await expect(result.current.refreshData()).rejects.toThrow("No file available");
    });

    it("updates data after refresh", async () => {
      const { result } = renderHook(() => useActualData());
      const file = createMockFile();
      const initialData = createMockWrappedData({ year: 2025 });
      const refreshedData = createMockWrappedData({ year: 2025, totalIncome: 99999 });

      mockTransformToWrappedData.mockReturnValueOnce(initialData);
      await result.current.fetchData(file);

      // Wait for initial data to be set
      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      mockTransformToWrappedData.mockReturnValueOnce(refreshedData);
      await result.current.refreshData();

      await waitFor(() => {
        expect(result.current.data?.totalIncome).toBe(99999);
      });
    });
  });

  describe("Cleanup", () => {
    it("calls shutdown on unmount", () => {
      const { unmount } = renderHook(() => useActualData());

      unmount();

      expect(mockShutdown).toHaveBeenCalled();
    });

    it("handles shutdown errors gracefully", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockShutdown.mockRejectedValue(new Error("Shutdown error"));

      const { unmount } = renderHook(() => useActualData());

      unmount();

      // Wait for async cleanup
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should not throw, error is caught and logged
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("Multiple Calls", () => {
    it("handles multiple fetchData calls", async () => {
      const { result } = renderHook(() => useActualData());
      const file1 = createMockFile();
      const file2 = createMockFile();

      await result.current.fetchData(file1);
      await result.current.fetchData(file2);

      expect(mockInitialize).toHaveBeenCalledTimes(2);
    });

    it("handles rapid successive calls", async () => {
      const { result } = renderHook(() => useActualData());
      const file = createMockFile();

      const promises = [
        result.current.fetchData(file),
        result.current.fetchData(file),
        result.current.fetchData(file),
      ];

      await Promise.all(promises);

      expect(mockInitialize).toHaveBeenCalled();
    });
  });
});
