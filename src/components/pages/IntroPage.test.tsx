import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../test-utils/test-utils";
import { IntroPage } from "./IntroPage";
import { createMockWrappedData } from "../../test-utils/mockData";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe("IntroPage", () => {
  it("renders without crashing", () => {
    const mockData = createMockWrappedData();
    render(<IntroPage data={mockData} />);

    expect(screen.getByText(/Your.*Budget/)).toBeInTheDocument();
  });

  it("displays correct year", () => {
    const mockData = createMockWrappedData({ year: 2025 });
    render(<IntroPage data={mockData} />);

    expect(screen.getByText("Your 2025 Budget")).toBeInTheDocument();
  });

  it("displays year in review subtitle", () => {
    const mockData = createMockWrappedData();
    render(<IntroPage data={mockData} />);

    expect(screen.getByText("Year in Review")).toBeInTheDocument();
  });

  it("displays total income", () => {
    const mockData = createMockWrappedData({ totalIncome: 60000 });
    render(<IntroPage data={mockData} />);

    expect(screen.getByText("Total Income")).toBeInTheDocument();
    expect(screen.getByText("$60,000")).toBeInTheDocument();
  });

  it("displays total expenses", () => {
    const mockData = createMockWrappedData({ totalExpenses: 36000 });
    render(<IntroPage data={mockData} />);

    expect(screen.getByText("Total Expenses")).toBeInTheDocument();
    expect(screen.getByText("$36,000")).toBeInTheDocument();
  });

  it("displays net savings", () => {
    const mockData = createMockWrappedData({ netSavings: 24000 });
    render(<IntroPage data={mockData} />);

    expect(screen.getByText("Net Savings")).toBeInTheDocument();
    expect(screen.getByText("$24,000")).toBeInTheDocument();
  });

  it("displays net savings correctly", () => {
    const mockData = createMockWrappedData({ netSavings: 24000 });
    render(<IntroPage data={mockData} />);

    expect(screen.getByText("Net Savings")).toBeInTheDocument();
    expect(screen.getByText("$24,000")).toBeInTheDocument();
  });

  it("formats large numbers correctly", () => {
    const mockData = createMockWrappedData({
      totalIncome: 1234567,
      totalExpenses: 987654,
    });
    render(<IntroPage data={mockData} />);

    expect(screen.getByText("$1,234,567")).toBeInTheDocument();
    expect(screen.getByText("$987,654")).toBeInTheDocument();
  });

  it("handles zero values", () => {
    const mockData = createMockWrappedData({
      totalIncome: 0,
      totalExpenses: 0,
      netSavings: 0,
      savingsRate: 0,
    });
    render(<IntroPage data={mockData} />);

    // $0 appears multiple times, so use getAllByText
    const zeroValues = screen.getAllByText("$0");
    expect(zeroValues.length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("Net Savings")).toBeInTheDocument();
  });

  it("handles negative net savings", () => {
    const mockData = createMockWrappedData({ netSavings: -5000 });
    render(<IntroPage data={mockData} />);

    // Component shows absolute value and "Net Loss" label
    expect(screen.getByText("$5,000")).toBeInTheDocument();
    expect(screen.getByText("Net Loss")).toBeInTheDocument();
  });

  it("renders page container with correct id", () => {
    const mockData = createMockWrappedData();
    const { container } = render(<IntroPage data={mockData} />);

    const pageContainer = container.querySelector("#intro-page");
    expect(pageContainer).toBeInTheDocument();
  });
});
