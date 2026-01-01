import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../test-utils/test-utils";
import { AccountBreakdownPage } from "./AccountBreakdownPage";
import { createMockWrappedData, createMockAccountBreakdown } from "../../test-utils/mockData";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<"div">) => <div {...props}>{children}</div>,
    h2: ({ children, ...props }: React.ComponentProps<"h2">) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: React.ComponentProps<"p">) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}));

// Mock recharts
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: React.PropsWithChildren) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: React.PropsWithChildren) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ children }: React.PropsWithChildren) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe("AccountBreakdownPage", () => {
  it("renders without crashing", () => {
    const mockData = createMockWrappedData();
    render(<AccountBreakdownPage data={mockData} />);
    expect(screen.getByText("Account Breakdown")).toBeInTheDocument();
  });

  it("displays page title", () => {
    const mockData = createMockWrappedData();
    render(<AccountBreakdownPage data={mockData} />);
    expect(screen.getByText("Account Breakdown")).toBeInTheDocument();
  });

  it("displays subtitle", () => {
    const mockData = createMockWrappedData();
    render(<AccountBreakdownPage data={mockData} />);
    expect(screen.getByText("Spending distribution across your accounts")).toBeInTheDocument();
  });

  it("displays account names", () => {
    const mockData = createMockWrappedData({
      accountBreakdown: createMockAccountBreakdown([
        {
          accountId: "acc1",
          accountName: "Checking",
          totalSpending: 20000,
          transactionCount: 50,
          percentage: 55.6,
        },
      ]),
    });
    render(<AccountBreakdownPage data={mockData} />);
    expect(screen.getByText("Checking")).toBeInTheDocument();
  });

  it("displays transaction counts", () => {
    const mockData = createMockWrappedData({
      accountBreakdown: createMockAccountBreakdown([
        {
          accountId: "acc1",
          accountName: "Checking",
          totalSpending: 20000,
          transactionCount: 50,
          percentage: 55.6,
        },
      ]),
    });
    render(<AccountBreakdownPage data={mockData} />);
    expect(screen.getByText(/50 transactions/)).toBeInTheDocument();
  });

  it("renders chart container", () => {
    const mockData = createMockWrappedData();
    render(<AccountBreakdownPage data={mockData} />);
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
  });

  it("renders page container with correct id", () => {
    const mockData = createMockWrappedData();
    const { container } = render(<AccountBreakdownPage data={mockData} />);
    const pageContainer = container.querySelector("#account-breakdown-page");
    expect(pageContainer).toBeInTheDocument();
  });

  it("handles empty account breakdown", () => {
    const mockData = createMockWrappedData({
      accountBreakdown: [],
    });
    render(<AccountBreakdownPage data={mockData} />);
    expect(screen.getByText("Account Breakdown")).toBeInTheDocument();
  });
});
