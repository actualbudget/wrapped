import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../test-utils/test-utils";
import { DayOfWeekAnalysisPage } from "./DayOfWeekAnalysisPage";
import { createMockWrappedData, createMockDayOfWeekSpending } from "../../test-utils/mockData";

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
  Cell: () => <div data-testid="cell" />,
}));

describe("DayOfWeekAnalysisPage", () => {
  it("renders without crashing", () => {
    const mockData = createMockWrappedData();
    render(<DayOfWeekAnalysisPage data={mockData} />);
    expect(screen.getByText("Day of Week Analysis")).toBeInTheDocument();
  });

  it("displays page title", () => {
    const mockData = createMockWrappedData();
    render(<DayOfWeekAnalysisPage data={mockData} />);
    expect(screen.getByText("Day of Week Analysis")).toBeInTheDocument();
  });

  it("displays subtitle", () => {
    const mockData = createMockWrappedData();
    render(<DayOfWeekAnalysisPage data={mockData} />);
    expect(screen.getByText("When you spend the most throughout the week")).toBeInTheDocument();
  });

  it("displays most and least expensive days", () => {
    const mockData = createMockWrappedData({
      dayOfWeekSpending: createMockDayOfWeekSpending([
        { dayName: "Monday", totalSpending: 1000 },
        { dayName: "Sunday", totalSpending: 500 },
      ]),
    });
    render(<DayOfWeekAnalysisPage data={mockData} />);
    expect(screen.getByText("Most Expensive Day")).toBeInTheDocument();
    expect(screen.getByText("Least Expensive Day")).toBeInTheDocument();
  });

  it("displays weekday vs weekend spending", () => {
    const mockData = createMockWrappedData();
    render(<DayOfWeekAnalysisPage data={mockData} />);
    expect(screen.getByText("Weekday Spending")).toBeInTheDocument();
  });

  it("renders chart container", () => {
    const mockData = createMockWrappedData();
    render(<DayOfWeekAnalysisPage data={mockData} />);
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("renders page container with correct id", () => {
    const mockData = createMockWrappedData();
    const { container } = render(<DayOfWeekAnalysisPage data={mockData} />);
    const pageContainer = container.querySelector("#day-of-week-analysis-page");
    expect(pageContainer).toBeInTheDocument();
  });
});
