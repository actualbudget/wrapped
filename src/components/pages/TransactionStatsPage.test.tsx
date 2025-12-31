import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../test-utils/test-utils";
import { TransactionStatsPage } from "./TransactionStatsPage";
import { createMockWrappedData } from "../../test-utils/mockData";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock useAnimatedNumber
vi.mock("../../hooks/useAnimatedNumber", () => ({
  useAnimatedNumber: (target: number) => target, // Return target immediately for testing
}));

// Mock integerToAmount
vi.mock("../../services/fileApi", () => ({
  integerToAmount: (amount: number) => amount / 100,
}));

describe("TransactionStatsPage", () => {
  it("renders without crashing", () => {
    const mockData = createMockWrappedData();
    render(<TransactionStatsPage data={mockData} />);

    expect(screen.getByText("Transaction Statistics")).toBeInTheDocument();
  });

  it("displays page title", () => {
    const mockData = createMockWrappedData();
    render(<TransactionStatsPage data={mockData} />);

    expect(screen.getByText("Transaction Statistics")).toBeInTheDocument();
  });

  it("displays subtitle", () => {
    const mockData = createMockWrappedData();
    render(<TransactionStatsPage data={mockData} />);

    expect(screen.getByText("A look at your spending activity")).toBeInTheDocument();
  });

  it("displays total transaction count", () => {
    const mockData = createMockWrappedData({
      transactionStats: {
        totalCount: 150,
        averageAmount: 100,
        largestTransaction: null,
      },
    });
    render(<TransactionStatsPage data={mockData} />);

    expect(screen.getByText("Total Transactions")).toBeInTheDocument();
    expect(screen.getByText("150")).toBeInTheDocument();
  });

  it("displays average transaction amount", () => {
    const mockData = createMockWrappedData({
      transactionStats: {
        totalCount: 100,
        averageAmount: 250.75,
        largestTransaction: null,
      },
    });
    render(<TransactionStatsPage data={mockData} />);

    expect(screen.getByText("Average Transaction")).toBeInTheDocument();
    expect(screen.getByText("$250.75")).toBeInTheDocument();
  });

  it("formats large average amounts without decimals", () => {
    const mockData = createMockWrappedData({
      transactionStats: {
        totalCount: 100,
        averageAmount: 10000,
        largestTransaction: null,
      },
    });
    render(<TransactionStatsPage data={mockData} />);

    expect(screen.getByText("$10,000")).toBeInTheDocument();
  });

  it("displays largest transaction amount", () => {
    const mockData = createMockWrappedData({
      transactionStats: {
        totalCount: 100,
        averageAmount: 100,
        largestTransaction: {
          id: "t1",
          account: "acc1",
          date: "2025-01-15",
          amount: -5000000, // $50,000 in cents
        },
      },
    });
    render(<TransactionStatsPage data={mockData} />);

    expect(screen.getByText("Largest Transaction")).toBeInTheDocument();
    expect(screen.getByText("$50,000")).toBeInTheDocument();
  });

  it("displays payee name for largest transaction", () => {
    const mockData = createMockWrappedData({
      transactionStats: {
        totalCount: 100,
        averageAmount: 100,
        largestTransaction: {
          id: "t1",
          account: "acc1",
          date: "2025-01-15",
          amount: -5000000,
          payee_name: "Big Store",
        },
      },
    });
    render(<TransactionStatsPage data={mockData} />);

    expect(screen.getByText("Big Store")).toBeInTheDocument();
  });

  it("displays 'Unknown payee' when payee_name is missing", () => {
    const mockData = createMockWrappedData({
      transactionStats: {
        totalCount: 100,
        averageAmount: 100,
        largestTransaction: {
          id: "t1",
          account: "acc1",
          date: "2025-01-15",
          amount: -5000000,
        },
      },
    });
    render(<TransactionStatsPage data={mockData} />);

    expect(screen.getByText("Unknown payee")).toBeInTheDocument();
  });

  it("handles null largest transaction", () => {
    const mockData = createMockWrappedData({
      transactionStats: {
        totalCount: 0,
        averageAmount: 0,
        largestTransaction: null,
      },
    });
    render(<TransactionStatsPage data={mockData} />);

    expect(screen.getByText("Largest Transaction")).toBeInTheDocument();
    expect(screen.queryByText("Unknown payee")).not.toBeInTheDocument();
  });

  it("handles zero values", () => {
    const mockData = createMockWrappedData({
      transactionStats: {
        totalCount: 0,
        averageAmount: 0,
        largestTransaction: null,
      },
    });
    render(<TransactionStatsPage data={mockData} />);

    expect(screen.getByText("0")).toBeInTheDocument();
    // $0.00 might appear multiple times, so use getAllByText
    const zeroAmounts = screen.getAllByText("$0.00");
    expect(zeroAmounts.length).toBeGreaterThan(0);
  });

  it("formats small amounts with 2 decimals", () => {
    const mockData = createMockWrappedData({
      transactionStats: {
        totalCount: 100,
        averageAmount: 99.99,
        largestTransaction: null,
      },
    });
    render(<TransactionStatsPage data={mockData} />);

    expect(screen.getByText("$99.99")).toBeInTheDocument();
  });

  it("renders page container with correct id", () => {
    const mockData = createMockWrappedData();
    const { container } = render(<TransactionStatsPage data={mockData} />);

    const pageContainer = container.querySelector("#transaction-stats-page");
    expect(pageContainer).toBeInTheDocument();
  });
});
