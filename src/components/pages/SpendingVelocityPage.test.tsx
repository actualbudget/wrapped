import { describe, it, expect, vi } from "vitest";

import { createMockWrappedData, createMockSpendingVelocity } from "../../test-utils/mockData";
import { render, screen } from "../../test-utils/test-utils";
import { SpendingVelocityPage } from "./SpendingVelocityPage";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<"div">) => <div {...props}>{children}</div>,
    h2: ({ children, ...props }: React.ComponentProps<"h2">) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: React.ComponentProps<"p">) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}));

// Mock useAnimatedNumber
vi.mock("../../hooks/useAnimatedNumber", () => ({
  useAnimatedNumber: (target: number) => target,
}));

// Mock recharts
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: React.PropsWithChildren) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: React.PropsWithChildren) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

describe("SpendingVelocityPage", () => {
  it("renders without crashing", () => {
    const mockData = createMockWrappedData();
    render(<SpendingVelocityPage data={mockData} />);
    expect(screen.getByText("Spending Velocity")).toBeInTheDocument();
  });

  it("displays page title", () => {
    const mockData = createMockWrappedData();
    render(<SpendingVelocityPage data={mockData} />);
    expect(screen.getByText("Spending Velocity")).toBeInTheDocument();
  });

  it("displays subtitle", () => {
    const mockData = createMockWrappedData();
    render(<SpendingVelocityPage data={mockData} />);
    expect(screen.getByText("Your daily spending pace throughout the year")).toBeInTheDocument();
  });

  it("displays daily average spending", () => {
    const mockData = createMockWrappedData({
      spendingVelocity: createMockSpendingVelocity({ dailyAverage: 150.5 }),
    });
    render(<SpendingVelocityPage data={mockData} />);
    expect(screen.getByText("$150.50/day")).toBeInTheDocument();
  });

  it("displays fastest and slowest periods", () => {
    const mockData = createMockWrappedData({
      spendingVelocity: createMockSpendingVelocity({
        fastestPeriod: { period: "Week 10", amount: 2000, averagePerDay: 285.71 },
        slowestPeriod: { period: "Week 2", amount: 500, averagePerDay: 71.43 },
      }),
    });
    render(<SpendingVelocityPage data={mockData} />);
    expect(screen.getByText("Fastest Spending Period")).toBeInTheDocument();
    expect(screen.getByText("Slowest Spending Period")).toBeInTheDocument();
    expect(screen.getByText("Week 10")).toBeInTheDocument();
    expect(screen.getByText("Week 2")).toBeInTheDocument();
  });

  it("renders chart container", () => {
    const mockData = createMockWrappedData();
    render(<SpendingVelocityPage data={mockData} />);
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("renders page container with correct id", () => {
    const mockData = createMockWrappedData();
    const { container } = render(<SpendingVelocityPage data={mockData} />);
    const pageContainer = container.querySelector("#spending-velocity-page");
    expect(pageContainer).toBeInTheDocument();
  });

  it("handles zero daily average", () => {
    const mockData = createMockWrappedData({
      spendingVelocity: createMockSpendingVelocity({ dailyAverage: 0 }),
    });
    render(<SpendingVelocityPage data={mockData} />);
    expect(screen.getByText("$0.00/day")).toBeInTheDocument();
  });
});
