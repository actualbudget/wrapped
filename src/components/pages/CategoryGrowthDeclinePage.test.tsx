import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../test-utils/test-utils";
import { CategoryGrowthDeclinePage } from "./CategoryGrowthDeclinePage";
import { createMockWrappedData, createMockCategoryGrowth } from "../../test-utils/mockData";

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

describe("CategoryGrowthDeclinePage", () => {
  it("renders without crashing", () => {
    const mockData = createMockWrappedData();
    render(<CategoryGrowthDeclinePage data={mockData} />);
    expect(screen.getByText("Category Growth & Decline")).toBeInTheDocument();
  });

  it("displays page title", () => {
    const mockData = createMockWrappedData();
    render(<CategoryGrowthDeclinePage data={mockData} />);
    expect(screen.getByText("Category Growth & Decline")).toBeInTheDocument();
  });

  it("displays subtitle", () => {
    const mockData = createMockWrappedData();
    render(<CategoryGrowthDeclinePage data={mockData} />);
    expect(screen.getByText("Categories with the biggest changes this year")).toBeInTheDocument();
  });

  it("displays top growing category", () => {
    const mockData = createMockWrappedData({
      categoryGrowth: createMockCategoryGrowth([
        {
          categoryId: "cat1",
          categoryName: "Groceries",
          firstMonthAmount: 400,
          lastMonthAmount: 600,
          totalChange: 200,
          percentageChange: 50,
          monthlyChanges: [],
        },
      ]),
    });
    render(<CategoryGrowthDeclinePage data={mockData} />);
    expect(screen.getByText("Top Growing Category")).toBeInTheDocument();
  });

  it("renders chart container", () => {
    const mockData = createMockWrappedData();
    render(<CategoryGrowthDeclinePage data={mockData} />);
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("renders page container with correct id", () => {
    const mockData = createMockWrappedData();
    const { container } = render(<CategoryGrowthDeclinePage data={mockData} />);
    const pageContainer = container.querySelector("#category-growth-decline-page");
    expect(pageContainer).toBeInTheDocument();
  });

  it("handles empty category growth", () => {
    const mockData = createMockWrappedData({
      categoryGrowth: [],
    });
    render(<CategoryGrowthDeclinePage data={mockData} />);
    expect(screen.getByText("Category Growth & Decline")).toBeInTheDocument();
  });
});
