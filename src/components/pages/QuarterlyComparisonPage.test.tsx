import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../test-utils/test-utils";
import { QuarterlyComparisonPage } from "./QuarterlyComparisonPage";
import { createMockWrappedData, createMockQuarterlyData } from "../../test-utils/mockData";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => children,
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
  Legend: () => <div data-testid="legend" />,
  Cell: () => <div data-testid="cell" />,
}));

describe("QuarterlyComparisonPage", () => {
  it("renders without crashing", () => {
    const mockData = createMockWrappedData();
    render(<QuarterlyComparisonPage data={mockData} />);
    expect(screen.getByText("Quarterly Comparison")).toBeInTheDocument();
  });

  it("displays page title", () => {
    const mockData = createMockWrappedData();
    render(<QuarterlyComparisonPage data={mockData} />);
    expect(screen.getByText("Quarterly Comparison")).toBeInTheDocument();
  });

  it("displays subtitle", () => {
    const mockData = createMockWrappedData();
    render(<QuarterlyComparisonPage data={mockData} />);
    expect(screen.getByText("Your financial performance by quarter")).toBeInTheDocument();
  });

  it("displays highest and lowest spending quarters", () => {
    const mockData = createMockWrappedData({
      quarterlyData: createMockQuarterlyData([
        { quarter: "Q1", income: 15000, expenses: 10000, netSavings: 5000, months: [] },
        { quarter: "Q2", income: 15000, expenses: 5000, netSavings: 10000, months: [] },
      ]),
    });
    render(<QuarterlyComparisonPage data={mockData} />);
    expect(screen.getByText("Highest Spending Quarter")).toBeInTheDocument();
    expect(screen.getByText("Lowest Spending Quarter")).toBeInTheDocument();
  });

  it("displays total savings", () => {
    const mockData = createMockWrappedData();
    render(<QuarterlyComparisonPage data={mockData} />);
    expect(screen.getByText("Total Savings (All Quarters)")).toBeInTheDocument();
  });

  it("renders chart container", () => {
    const mockData = createMockWrappedData();
    render(<QuarterlyComparisonPage data={mockData} />);
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("renders page container with correct id", () => {
    const mockData = createMockWrappedData();
    const { container } = render(<QuarterlyComparisonPage data={mockData} />);
    const pageContainer = container.querySelector("#quarterly-comparison-page");
    expect(pageContainer).toBeInTheDocument();
  });
});
