import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../test-utils/test-utils";
import { SpendingStreaksPage } from "./SpendingStreaksPage";
import { createMockWrappedData, createMockSpendingStreaks } from "../../test-utils/mockData";

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

describe("SpendingStreaksPage", () => {
  it("renders without crashing", () => {
    const mockData = createMockWrappedData();
    render(<SpendingStreaksPage data={mockData} />);
    expect(screen.getByText("Spending Streaks")).toBeInTheDocument();
  });

  it("displays page title", () => {
    const mockData = createMockWrappedData();
    render(<SpendingStreaksPage data={mockData} />);
    expect(screen.getByText("Spending Streaks")).toBeInTheDocument();
  });

  it("displays subtitle", () => {
    const mockData = createMockWrappedData();
    render(<SpendingStreaksPage data={mockData} />);
    expect(screen.getByText("Your longest spending patterns")).toBeInTheDocument();
  });

  it("displays longest spending streak", () => {
    const mockData = createMockWrappedData({
      spendingStreaks: createMockSpendingStreaks({
        longestSpendingStreak: { days: 15, startDate: "2025-03-01", endDate: "2025-03-15" },
      }),
    });
    render(<SpendingStreaksPage data={mockData} />);
    expect(screen.getByText("Longest Spending Streak")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("displays longest no-spending streak", () => {
    const mockData = createMockWrappedData({
      spendingStreaks: createMockSpendingStreaks({
        longestNoSpendingStreak: { days: 5, startDate: "2025-06-10", endDate: "2025-06-14" },
      }),
    });
    render(<SpendingStreaksPage data={mockData} />);
    expect(screen.getByText("Longest No-Spending Streak")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("displays total spending days", () => {
    const mockData = createMockWrappedData({
      spendingStreaks: createMockSpendingStreaks({ totalSpendingDays: 200 }),
    });
    render(<SpendingStreaksPage data={mockData} />);
    expect(screen.getByText("Days with Spending")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
  });

  it("renders page container with correct id", () => {
    const mockData = createMockWrappedData();
    const { container } = render(<SpendingStreaksPage data={mockData} />);
    const pageContainer = container.querySelector("#spending-streaks-page");
    expect(pageContainer).toBeInTheDocument();
  });

  it("handles zero streaks", () => {
    const mockData = createMockWrappedData({
      spendingStreaks: createMockSpendingStreaks({
        longestSpendingStreak: { days: 0, startDate: "", endDate: "" },
        longestNoSpendingStreak: { days: 0, startDate: "", endDate: "" },
      }),
    });
    render(<SpendingStreaksPage data={mockData} />);
    expect(screen.getByText("Spending Streaks")).toBeInTheDocument();
  });
});
