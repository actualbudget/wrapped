import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../test-utils/test-utils";
import { TransactionSizeDistributionPage } from "./TransactionSizeDistributionPage";
import {
  createMockWrappedData,
  createMockTransactionSizeDistribution,
} from "../../test-utils/mockData";

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
  useAnimatedNumber: (target: number) => target,
}));

// Mock recharts
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: ({ children }: any) => <div data-testid="bar">{children}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Cell: () => <div data-testid="cell" />,
}));

describe("TransactionSizeDistributionPage", () => {
  it("renders without crashing", () => {
    const mockData = createMockWrappedData();
    render(<TransactionSizeDistributionPage data={mockData} />);
    expect(screen.getByText("Transaction Size Distribution")).toBeInTheDocument();
  });

  it("displays page title", () => {
    const mockData = createMockWrappedData();
    render(<TransactionSizeDistributionPage data={mockData} />);
    expect(screen.getByText("Transaction Size Distribution")).toBeInTheDocument();
  });

  it("displays subtitle", () => {
    const mockData = createMockWrappedData();
    render(<TransactionSizeDistributionPage data={mockData} />);
    expect(screen.getByText("How your transaction sizes are distributed")).toBeInTheDocument();
  });

  it("displays median transaction", () => {
    const mockData = createMockWrappedData({
      transactionSizeDistribution: createMockTransactionSizeDistribution({ median: 45 }),
    });
    render(<TransactionSizeDistributionPage data={mockData} />);
    expect(screen.getByText("Median Transaction")).toBeInTheDocument();
    expect(screen.getByText("$45.00")).toBeInTheDocument();
  });

  it("displays mode", () => {
    const mockData = createMockWrappedData({
      transactionSizeDistribution: createMockTransactionSizeDistribution({ mode: 25 }),
    });
    render(<TransactionSizeDistributionPage data={mockData} />);
    expect(screen.getByText("Mode (Most Common)")).toBeInTheDocument();
    expect(screen.getByText("$25.00")).toBeInTheDocument();
  });

  it("displays most common range", () => {
    const mockData = createMockWrappedData({
      transactionSizeDistribution: createMockTransactionSizeDistribution({
        mostCommonRange: "$10-$50",
      }),
    });
    render(<TransactionSizeDistributionPage data={mockData} />);
    expect(screen.getByText("Most Common Range")).toBeInTheDocument();
    expect(screen.getByText("$10-$50")).toBeInTheDocument();
  });

  it("renders chart container", () => {
    const mockData = createMockWrappedData();
    render(<TransactionSizeDistributionPage data={mockData} />);
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("renders page container with correct id", () => {
    const mockData = createMockWrappedData();
    const { container } = render(<TransactionSizeDistributionPage data={mockData} />);
    const pageContainer = container.querySelector("#transaction-size-distribution-page");
    expect(pageContainer).toBeInTheDocument();
  });
});
