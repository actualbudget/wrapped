import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../test-utils/test-utils";
import { FutureProjectionPage } from "./FutureProjectionPage";
import {
  createMockWrappedData,
  createMockFutureProjection,
  createMockSavingsMilestones,
} from "../../test-utils/mockData";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<"div">) => <div {...props}>{children}</div>,
    h2: ({ children, ...props }: React.ComponentProps<"h2">) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }: React.ComponentProps<"h3">) => <h3 {...props}>{children}</h3>,
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
  Legend: () => <div data-testid="legend" />,
  ReferenceLine: ({ children }: React.PropsWithChildren) => (
    <div data-testid="reference-line">{children}</div>
  ),
  Label: () => <div data-testid="label" />,
}));

describe("FutureProjectionPage", () => {
  it("renders without crashing", () => {
    const mockData = createMockWrappedData();
    render(<FutureProjectionPage data={mockData} />);
    expect(screen.getByText("Future Projection")).toBeInTheDocument();
  });

  it("displays page title", () => {
    const mockData = createMockWrappedData();
    render(<FutureProjectionPage data={mockData} />);
    expect(screen.getByText("Future Projection")).toBeInTheDocument();
  });

  it("displays subtitle", () => {
    const mockData = createMockWrappedData();
    render(<FutureProjectionPage data={mockData} />);
    expect(
      screen.getByText("If you continue at this pace, here's what the next year looks like"),
    ).toBeInTheDocument();
  });

  it("displays projected year end savings", () => {
    const mockData = createMockWrappedData({
      futureProjection: createMockFutureProjection({ projectedYearEndSavings: 48000 }),
    });
    render(<FutureProjectionPage data={mockData} />);
    expect(screen.getByText("Projected Savings (Next Year End)")).toBeInTheDocument();
    expect(screen.getByText("$48,000")).toBeInTheDocument();
  });

  it("displays daily net savings", () => {
    const mockData = createMockWrappedData({
      futureProjection: createMockFutureProjection({ dailyNetSavings: 65.75 }),
    });
    render(<FutureProjectionPage data={mockData} />);
    expect(screen.getByText("Daily Net Savings")).toBeInTheDocument();
    expect(screen.getByText("$65.75")).toBeInTheDocument();
  });

  it("displays months until zero when applicable", () => {
    const mockData = createMockWrappedData({
      futureProjection: createMockFutureProjection({ monthsUntilZero: 8 }),
    });
    render(<FutureProjectionPage data={mockData} />);
    expect(screen.getByText("Months Until Zero Savings")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("displays growth message when savings continue growing", () => {
    const mockData = createMockWrappedData({
      futureProjection: createMockFutureProjection({ monthsUntilZero: null }),
    });
    render(<FutureProjectionPage data={mockData} />);
    expect(screen.getByText("Savings Will Continue Growing")).toBeInTheDocument();
  });

  it("renders chart container", () => {
    const mockData = createMockWrappedData();
    render(<FutureProjectionPage data={mockData} />);
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("renders page container with correct id", () => {
    const mockData = createMockWrappedData();
    const { container } = render(<FutureProjectionPage data={mockData} />);
    const pageContainer = container.querySelector("#future-projection-page");
    expect(pageContainer).toBeInTheDocument();
  });

  it("renders reference lines for savings milestones when they exist", () => {
    const mockData = createMockWrappedData({
      savingsMilestones: createMockSavingsMilestones([
        { milestone: "$10k", amount: 10000, date: "2025-04-15", cumulativeSavings: 10000 },
      ]),
    });
    render(<FutureProjectionPage data={mockData} />);
    // Reference lines should be rendered (they're inside the chart)
    const referenceLines = screen.getAllByTestId("reference-line");
    expect(referenceLines.length).toBeGreaterThan(0);
  });

  it("does not render milestone reference lines when empty", () => {
    const mockData = createMockWrappedData({
      savingsMilestones: [],
    });
    render(<FutureProjectionPage data={mockData} />);
    // Should still have the zero reference line, but no milestone lines
    const referenceLines = screen.getAllByTestId("reference-line");
    expect(referenceLines.length).toBe(1); // Only the zero line
  });
});
