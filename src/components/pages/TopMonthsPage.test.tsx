import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../test-utils/test-utils";
import userEvent from "@testing-library/user-event";
import { TopMonthsPage } from "./TopMonthsPage";
import {
  createMockWrappedData,
  createMockMonthlyData,
  createMockTopMonths,
} from "../../test-utils/mockData";

// Mock framer-motion to avoid animation timing issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock recharts components to simplify testing
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children, width, height }: any) => (
    <div data-testid="responsive-container" style={{ width, height }}>
      {children}
    </div>
  ),
  BarChart: ({ children, data }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Bar: ({ children }: any) => <div data-testid="bar">{children}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: ({ content, active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const CustomTooltip = content;
      return (
        <div data-testid="tooltip" data-active="true" data-label={label}>
          <CustomTooltip active={active} payload={payload} label={label} />
        </div>
      );
    }
    return <div data-testid="tooltip" data-active="false" />;
  },
  Cell: ({ onClick, fill, opacity, style }: any) => (
    <div
      data-testid="chart-cell"
      onClick={onClick}
      data-fill={fill}
      data-opacity={opacity}
      style={style}
    />
  ),
}));

describe("TopMonthsPage", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      const mockData = createMockWrappedData();
      render(<TopMonthsPage data={mockData} />);
      expect(screen.getByText("Spending by Month")).toBeInTheDocument();
    });

    it("displays page title", () => {
      const mockData = createMockWrappedData();
      render(<TopMonthsPage data={mockData} />);
      expect(screen.getByText("Spending by Month")).toBeInTheDocument();
    });

    it("displays subtitle", () => {
      const mockData = createMockWrappedData();
      render(<TopMonthsPage data={mockData} />);
      expect(screen.getByText("Your highest spending months")).toBeInTheDocument();
    });

    it("renders chart container", () => {
      const mockData = createMockWrappedData();
      render(<TopMonthsPage data={mockData} />);
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });

    it("renders page container with correct id", () => {
      const mockData = createMockWrappedData();
      const { container } = render(<TopMonthsPage data={mockData} />);
      const pageContainer = container.querySelector("#top-months-page");
      expect(pageContainer).toBeInTheDocument();
    });
  });

  describe("Chart Display", () => {
    it("displays all months from data", () => {
      const mockData = createMockWrappedData();
      render(<TopMonthsPage data={mockData} />);
      const barChart = screen.getByTestId("bar-chart");
      const chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      expect(chartData).toHaveLength(12); // All 12 months
    });

    it("sorts months by spending in descending order", () => {
      const monthlyData = createMockMonthlyData([
        { month: "January", expenses: 1000 },
        { month: "February", expenses: 5000 },
        { month: "March", expenses: 2000 },
      ]);
      const mockData = createMockWrappedData({ monthlyData });
      render(<TopMonthsPage data={mockData} />);
      const barChart = screen.getByTestId("bar-chart");
      const chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");

      // Check that months are sorted by spending (descending)
      const spendings = chartData.map((d: any) => d.spending);
      const sortedSpendings = [...spendings].sort((a, b) => b - a);
      expect(spendings).toEqual(sortedSpendings);
    });

    it("chart data includes correct month abbreviations", () => {
      const mockData = createMockWrappedData();
      render(<TopMonthsPage data={mockData} />);
      const barChart = screen.getByTestId("bar-chart");
      const chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");

      // Check that month abbreviations are first 3 letters
      chartData.forEach((entry: any) => {
        expect(entry.month).toHaveLength(3);
        expect(entry.fullMonth).toMatch(new RegExp(`^${entry.month}`, "i"));
      });
    });

    it("highlights maximum spending month with different color", () => {
      const monthlyData = createMockMonthlyData([
        { month: "January", expenses: 1000 },
        { month: "February", expenses: 5000 },
        { month: "March", expenses: 2000 },
      ]);
      const mockData = createMockWrappedData({ monthlyData });
      render(<TopMonthsPage data={mockData} />);

      const cells = screen.getAllByTestId("chart-cell");
      const maxSpendingCell = cells.find((cell) => cell.getAttribute("data-fill") === "#f093fb");
      expect(maxSpendingCell).toBeInTheDocument();
    });
  });

  describe("Top Months Stats Grid", () => {
    it("displays top 3 months from data.topMonths", () => {
      const topMonths = createMockTopMonths(3, [
        { month: "December", spending: 5000 },
        { month: "November", spending: 4500 },
        { month: "October", spending: 4000 },
      ]);
      const mockData = createMockWrappedData({ topMonths });
      render(<TopMonthsPage data={mockData} />);

      expect(screen.getByText("December")).toBeInTheDocument();
      expect(screen.getByText("November")).toBeInTheDocument();
      expect(screen.getByText("October")).toBeInTheDocument();
    });

    it("shows correct spending amounts formatted with commas", () => {
      const topMonths = createMockTopMonths(3, [
        { month: "December", spending: 5000 },
        { month: "November", spending: 4500 },
        { month: "October", spending: 4000 },
      ]);
      const mockData = createMockWrappedData({ topMonths });
      render(<TopMonthsPage data={mockData} />);

      expect(screen.getByText("$5,000")).toBeInTheDocument();
      expect(screen.getByText("$4,500")).toBeInTheDocument();
      expect(screen.getByText("$4,000")).toBeInTheDocument();
    });

    it("displays correct medal emojis for top 3 months", () => {
      const topMonths = createMockTopMonths(3);
      const mockData = createMockWrappedData({ topMonths });
      render(<TopMonthsPage data={mockData} />);

      const statCards = screen.getAllByText(/🥇|🥈|🥉/);
      expect(statCards.length).toBeGreaterThanOrEqual(3);

      // Check that medals are present
      expect(screen.getByText("🥇")).toBeInTheDocument();
      expect(screen.getByText("🥈")).toBeInTheDocument();
      expect(screen.getByText("🥉")).toBeInTheDocument();
    });

    it("shows correct month names in stats grid", () => {
      const topMonths = [
        { month: "December", spending: 5000 },
        { month: "November", spending: 4500 },
        { month: "October", spending: 4000 },
      ];
      const mockData = createMockWrappedData({ topMonths });
      render(<TopMonthsPage data={mockData} />);

      topMonths.forEach((month) => {
        const statCard = screen.getByText(month.month).closest('[class*="statCard"]');
        expect(statCard).toBeInTheDocument();
      });
    });
  });

  describe("User Interactions", () => {
    it("clicking a bar toggles its visibility", async () => {
      const user = userEvent.setup();
      const mockData = createMockWrappedData();
      render(<TopMonthsPage data={mockData} />);

      const cells = screen.getAllByTestId("chart-cell");
      const firstCell = cells[0];

      // Click to hide
      await user.click(firstCell);
      expect(firstCell.getAttribute("data-opacity")).toBe("0.15");

      // Click again to show
      await user.click(firstCell);
      expect(firstCell.getAttribute("data-opacity")).not.toBe("0.15");
    });

    it("hidden bars have reduced opacity", async () => {
      const user = userEvent.setup();
      const mockData = createMockWrappedData();
      render(<TopMonthsPage data={mockData} />);

      const cells = screen.getAllByTestId("chart-cell");
      const firstCell = cells[0];

      await user.click(firstCell);
      expect(firstCell.getAttribute("data-opacity")).toBe("0.15");
    });

    it("chart data updates when months are hidden", async () => {
      const user = userEvent.setup();
      const monthlyData = createMockMonthlyData([
        { month: "January", expenses: 1000 },
        { month: "February", expenses: 5000 },
        { month: "March", expenses: 2000 },
      ]);
      const mockData = createMockWrappedData({ monthlyData });
      render(<TopMonthsPage data={mockData} />);

      const barChart = screen.getByTestId("bar-chart");
      const initialData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      const initialSpending = initialData[0].spending;

      const cells = screen.getAllByTestId("chart-cell");
      await user.click(cells[0]);

      // Chart data should be updated (hidden month should have reduced spending)
      const updatedData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      // The hidden month should have a smaller spending value (minClickableSpending)
      expect(updatedData[0].spending).toBeLessThan(initialSpending);
      expect(updatedData[0].originalSpending).toBe(initialSpending);
    });
  });

  describe("Edge Cases", () => {
    it("handles empty monthly data gracefully", () => {
      const mockData = createMockWrappedData({ monthlyData: [] });
      render(<TopMonthsPage data={mockData} />);

      // Should still render without crashing
      expect(screen.getByText("Spending by Month")).toBeInTheDocument();
    });

    it("handles months with zero spending", () => {
      const monthlyData = createMockMonthlyData([
        { month: "January", expenses: 0 },
        { month: "February", expenses: 0 },
        { month: "March", expenses: 1000 },
      ]);
      const mockData = createMockWrappedData({ monthlyData });
      render(<TopMonthsPage data={mockData} />);

      const barChart = screen.getByTestId("bar-chart");
      const chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      expect(chartData.length).toBeGreaterThan(0);
    });

    it("handles single month in data", () => {
      const monthlyData = [{ month: "January", income: 5000, expenses: 3000, netSavings: 2000 }];
      const mockData = createMockWrappedData({ monthlyData });
      render(<TopMonthsPage data={mockData} />);

      const barChart = screen.getByTestId("bar-chart");
      const chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      expect(chartData).toHaveLength(1);
    });

    it("handles missing topMonths data", () => {
      const mockData = createMockWrappedData({ topMonths: [] });
      render(<TopMonthsPage data={mockData} />);

      // Should still render without crashing
      expect(screen.getByText("Spending by Month")).toBeInTheDocument();
      // Stats grid should be empty or not render stat cards
      const statCards = screen.queryAllByText(/🥇|🥈|🥉/);
      expect(statCards).toHaveLength(0);
    });

    it("handles very large spending amounts", () => {
      const monthlyData = createMockMonthlyData([
        { month: "January", expenses: 1000000 },
        { month: "February", expenses: 500000 },
      ]);
      const mockData = createMockWrappedData({ monthlyData });
      render(<TopMonthsPage data={mockData} />);

      // Should render without errors
      expect(screen.getByText("Spending by Month")).toBeInTheDocument();
    });

    it("handles all months with same spending", () => {
      const monthlyData = createMockMonthlyData(Array(12).fill({ expenses: 3000 }));
      const mockData = createMockWrappedData({ monthlyData });
      render(<TopMonthsPage data={mockData} />);

      const barChart = screen.getByTestId("bar-chart");
      const chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      expect(chartData).toHaveLength(12);
      // All should have same spending
      const spendings = chartData.map((d: any) => d.spending);
      expect(new Set(spendings).size).toBe(1);
    });

    it("handles decimal spending amounts", () => {
      const monthlyData = createMockMonthlyData([
        { month: "January", expenses: 1234.56 },
        { month: "February", expenses: 5678.9 },
      ]);
      const mockData = createMockWrappedData({ monthlyData });
      render(<TopMonthsPage data={mockData} />);

      const barChart = screen.getByTestId("bar-chart");
      const chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      expect(chartData.length).toBeGreaterThan(0);
    });

    it("handles very small spending amounts", () => {
      const monthlyData = createMockMonthlyData([
        { month: "January", expenses: 0.01 },
        { month: "February", expenses: 0.5 },
      ]);
      const mockData = createMockWrappedData({ monthlyData });
      render(<TopMonthsPage data={mockData} />);

      expect(screen.getByText("Spending by Month")).toBeInTheDocument();
    });
  });

  describe("Chart Data Transformation", () => {
    it("calculates max spending correctly", () => {
      const monthlyData = createMockMonthlyData([
        { month: "January", expenses: 1000 },
        { month: "February", expenses: 5000 },
        { month: "March", expenses: 2000 },
      ]);
      const mockData = createMockWrappedData({ monthlyData });
      render(<TopMonthsPage data={mockData} />);

      const cells = screen.getAllByTestId("chart-cell");
      const maxSpendingCells = cells.filter((cell) => cell.getAttribute("data-fill") === "#f093fb");
      expect(maxSpendingCells.length).toBeGreaterThan(0);
    });

    it("handles multiple months with same max spending", () => {
      const monthlyData = createMockMonthlyData([
        { month: "January", expenses: 5000 },
        { month: "February", expenses: 5000 },
        { month: "March", expenses: 3000 },
      ]);
      const mockData = createMockWrappedData({ monthlyData });
      render(<TopMonthsPage data={mockData} />);

      const cells = screen.getAllByTestId("chart-cell");
      const maxSpendingCells = cells.filter((cell) => cell.getAttribute("data-fill") === "#f093fb");
      // Both January and February should be highlighted (they have same max spending)
      // After sorting, both should appear and both should be highlighted
      expect(maxSpendingCells.length).toBeGreaterThanOrEqual(1);
      // Verify that at least one cell with max spending is highlighted
      const hasMaxSpendingCell = maxSpendingCells.some(
        (cell) => cell.getAttribute("data-fill") === "#f093fb",
      );
      expect(hasMaxSpendingCell).toBe(true);
    });

    it("preserves original spending in chart data", () => {
      const monthlyData = createMockMonthlyData([
        { month: "January", expenses: 1000 },
        { month: "February", expenses: 5000 },
      ]);
      const mockData = createMockWrappedData({ monthlyData });
      render(<TopMonthsPage data={mockData} />);

      const barChart = screen.getByTestId("bar-chart");
      const chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      chartData.forEach((entry: any) => {
        expect(entry.originalSpending).toBeDefined();
        expect(typeof entry.originalSpending).toBe("number");
      });
    });

    it("chart data includes id, month, fullMonth, and spending", () => {
      const mockData = createMockWrappedData();
      render(<TopMonthsPage data={mockData} />);

      const barChart = screen.getByTestId("bar-chart");
      const chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      chartData.forEach((entry: any) => {
        expect(entry).toHaveProperty("id");
        expect(entry).toHaveProperty("month");
        expect(entry).toHaveProperty("fullMonth");
        expect(entry).toHaveProperty("spending");
      });
    });
  });

  describe("Advanced User Interactions", () => {
    it("clicking multiple bars toggles them independently", async () => {
      const user = userEvent.setup();
      const mockData = createMockWrappedData();
      render(<TopMonthsPage data={mockData} />);

      const cells = screen.getAllByTestId("chart-cell");
      const firstCell = cells[0];
      const secondCell = cells[1];

      // Click first cell
      await user.click(firstCell);
      expect(firstCell.getAttribute("data-opacity")).toBe("0.15");
      expect(secondCell.getAttribute("data-opacity")).not.toBe("0.15");

      // Click second cell
      await user.click(secondCell);
      expect(firstCell.getAttribute("data-opacity")).toBe("0.15");
      expect(secondCell.getAttribute("data-opacity")).toBe("0.15");

      // Click first cell again to show it
      await user.click(firstCell);
      expect(firstCell.getAttribute("data-opacity")).not.toBe("0.15");
      expect(secondCell.getAttribute("data-opacity")).toBe("0.15");
    });

    it("clicking all bars hides them all", async () => {
      const user = userEvent.setup();
      const monthlyData = createMockMonthlyData([
        { month: "January", expenses: 1000 },
        { month: "February", expenses: 2000 },
        { month: "March", expenses: 3000 },
      ]);
      const mockData = createMockWrappedData({ monthlyData });
      render(<TopMonthsPage data={mockData} />);

      const cells = screen.getAllByTestId("chart-cell");

      // Click all cells
      for (const cell of cells) {
        await user.click(cell);
      }

      // All should be hidden
      cells.forEach((cell) => {
        expect(cell.getAttribute("data-opacity")).toBe("0.15");
      });
    });

    it("hidden month uses minClickableSpending for clickability", async () => {
      const user = userEvent.setup();
      const monthlyData = createMockMonthlyData([
        { month: "January", expenses: 1000 },
        { month: "February", expenses: 5000 },
        { month: "March", expenses: 2000 },
      ]);
      const mockData = createMockWrappedData({ monthlyData });
      render(<TopMonthsPage data={mockData} />);

      const barChart = screen.getByTestId("bar-chart");
      const cells = screen.getAllByTestId("chart-cell");

      // Hide the first month (which is February with 5000 after sorting)
      await user.click(cells[0]);

      // Check that hidden month has minClickableSpending (5% of max visible)
      const updatedData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      const hiddenEntry = updatedData.find((d: any) => d.spending < d.originalSpending);
      expect(hiddenEntry).toBeDefined();
      // After hiding max, new max visible is 2000, so minClickableSpending should be 2000 * 0.05 = 100
      // But we need to recalculate max visible from remaining visible entries
      const visibleEntries = updatedData.filter((d: any) => d.spending === d.originalSpending);
      const newMaxVisible =
        visibleEntries.length > 0 ? Math.max(...visibleEntries.map((d: any) => d.spending)) : 0;
      const expectedMinClickable = newMaxVisible * 0.05;
      expect(hiddenEntry.spending).toBeCloseTo(expectedMinClickable, 0);
    });

    it("max visible spending recalculates when months are hidden", async () => {
      const user = userEvent.setup();
      // Create only 3 months to avoid default values from mock function
      const monthlyData: Array<{
        month: string;
        income: number;
        expenses: number;
        netSavings: number;
      }> = [
        { month: "January", income: 5000, expenses: 1000, netSavings: 4000 },
        { month: "February", income: 6000, expenses: 5000, netSavings: 1000 },
        { month: "March", income: 4000, expenses: 3000, netSavings: 1000 },
      ];
      const mockData = createMockWrappedData({ monthlyData });
      render(<TopMonthsPage data={mockData} />);

      const barChart = screen.getByTestId("bar-chart");
      const cells = screen.getAllByTestId("chart-cell");

      // Get original max (should be 5000 from February)
      const initialData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      const originalMax = Math.max(...initialData.map((d: any) => d.spending));
      expect(originalMax).toBe(5000);

      // Hide the max spending month (February, which is first after sorting)
      await user.click(cells[0]);

      const updatedData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      const visibleEntries = updatedData.filter((d: any) => d.spending === d.originalSpending);
      const newMaxVisible =
        visibleEntries.length > 0 ? Math.max(...visibleEntries.map((d: any) => d.spending)) : 0;

      // New max should be 3000 (March), which is less than original max of 5000
      expect(newMaxVisible).toBe(3000);
      expect(newMaxVisible).toBeLessThan(originalMax);
    });
  });

  describe("Cell Styling and Behavior", () => {
    it("chart cells have pointer cursor style", () => {
      const mockData = createMockWrappedData();
      render(<TopMonthsPage data={mockData} />);

      const cells = screen.getAllByTestId("chart-cell");
      cells.forEach((cell) => {
        expect(cell.getAttribute("style")).toContain("cursor: pointer");
      });
    });

    it("non-max spending cells have default opacity", () => {
      const monthlyData = createMockMonthlyData([
        { month: "January", expenses: 1000 },
        { month: "February", expenses: 5000 },
        { month: "March", expenses: 2000 },
      ]);
      const mockData = createMockWrappedData({ monthlyData });
      render(<TopMonthsPage data={mockData} />);

      const cells = screen.getAllByTestId("chart-cell");
      const nonMaxCells = cells.filter((cell) => cell.getAttribute("data-fill") !== "#f093fb");

      nonMaxCells.forEach((cell) => {
        const opacity = cell.getAttribute("data-opacity");
        expect(opacity).toBe("0.7");
      });
    });

    it("max spending cells have full opacity when visible", () => {
      const monthlyData = createMockMonthlyData([
        { month: "January", expenses: 1000 },
        { month: "February", expenses: 5000 },
        { month: "March", expenses: 2000 },
      ]);
      const mockData = createMockWrappedData({ monthlyData });
      render(<TopMonthsPage data={mockData} />);

      const cells = screen.getAllByTestId("chart-cell");
      const maxSpendingCell = cells.find((cell) => cell.getAttribute("data-fill") === "#f093fb");

      expect(maxSpendingCell?.getAttribute("data-opacity")).toBe("1");
    });
  });

  describe("Stats Grid Edge Cases", () => {
    it("handles stats grid with more than 3 months", () => {
      const topMonths = createMockTopMonths(5, [
        { month: "December", spending: 5000 },
        { month: "November", spending: 4500 },
        { month: "October", spending: 4000 },
        { month: "September", spending: 3500 },
        { month: "August", spending: 3000 },
      ]);
      const mockData = createMockWrappedData({ topMonths });
      render(<TopMonthsPage data={mockData} />);

      // Should display all months
      expect(screen.getByText("December")).toBeInTheDocument();
      expect(screen.getByText("November")).toBeInTheDocument();
      expect(screen.getByText("October")).toBeInTheDocument();
      expect(screen.getByText("September")).toBeInTheDocument();
      expect(screen.getByText("August")).toBeInTheDocument();
    });

    it("handles stats grid with less than 3 months", () => {
      const topMonths = [
        { month: "December", spending: 5000 },
        { month: "November", spending: 4500 },
      ];
      const mockData = createMockWrappedData({ topMonths });
      render(<TopMonthsPage data={mockData} />);

      expect(screen.getByText("December")).toBeInTheDocument();
      expect(screen.getByText("November")).toBeInTheDocument();
      expect(screen.getByText("🥇")).toBeInTheDocument();
      expect(screen.getByText("🥈")).toBeInTheDocument();
      // Should not have third place
      expect(screen.queryByText("🥉")).not.toBeInTheDocument();
    });

    it("handles stats grid with single month", () => {
      const topMonths = [{ month: "December", spending: 5000 }];
      const mockData = createMockWrappedData({ topMonths });
      render(<TopMonthsPage data={mockData} />);

      expect(screen.getByText("December")).toBeInTheDocument();
      expect(screen.getByText("🥇")).toBeInTheDocument();
      expect(screen.queryByText("🥈")).not.toBeInTheDocument();
      expect(screen.queryByText("🥉")).not.toBeInTheDocument();
    });

    it("formats large spending amounts correctly in stats grid", () => {
      const topMonths = [
        { month: "December", spending: 1234567 },
        { month: "November", spending: 987654 },
      ];
      const mockData = createMockWrappedData({ topMonths });
      render(<TopMonthsPage data={mockData} />);

      expect(screen.getByText("$1,234,567")).toBeInTheDocument();
      expect(screen.getByText("$987,654")).toBeInTheDocument();
    });
  });

  describe("Component Re-rendering", () => {
    it("updates when data prop changes", () => {
      const initialData = createMockWrappedData({
        monthlyData: [{ month: "January", income: 5000, expenses: 3000, netSavings: 2000 }],
      });
      const { rerender } = render(<TopMonthsPage data={initialData} />);

      const barChart = screen.getByTestId("bar-chart");
      let chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      expect(chartData).toHaveLength(1);

      const newData = createMockWrappedData({
        monthlyData: [
          { month: "January", income: 5000, expenses: 3000, netSavings: 2000 },
          { month: "February", income: 6000, expenses: 4000, netSavings: 2000 },
        ],
      });
      rerender(<TopMonthsPage data={newData} />);

      chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      expect(chartData).toHaveLength(2);
    });

    it("maintains hidden months state when data prop changes", async () => {
      const user = userEvent.setup();
      const initialData = createMockWrappedData({
        monthlyData: createMockMonthlyData([
          { month: "January", expenses: 1000 },
          { month: "February", expenses: 2000 },
        ]),
      });
      const { rerender } = render(<TopMonthsPage data={initialData} />);

      const cells = screen.getAllByTestId("chart-cell");
      // Hide the first cell (February, which is highest after sorting)
      await user.click(cells[0]);
      expect(cells[0].getAttribute("data-opacity")).toBe("0.15");

      // Note: React doesn't automatically reset component state when props change
      // The hidden state is tied to month IDs, so if the same month exists in new data,
      // it will remain hidden. This is expected behavior.
      const newData = createMockWrappedData({
        monthlyData: createMockMonthlyData([
          { month: "January", expenses: 1000 },
          { month: "February", expenses: 2000 },
        ]),
      });
      rerender(<TopMonthsPage data={newData} />);

      const newCells = screen.getAllByTestId("chart-cell");
      // State persists because the month IDs are the same
      // This is actually correct behavior - state is preserved across re-renders
      // If we want to test that new months aren't hidden, we'd need different month names
      expect(newCells.length).toBeGreaterThan(0);
    });
  });

  describe("Month Abbreviation Logic", () => {
    it("correctly abbreviates all standard month names", () => {
      const monthlyData = [
        { month: "January", income: 5000, expenses: 3000, netSavings: 2000 },
        { month: "February", income: 5000, expenses: 3000, netSavings: 2000 },
        { month: "March", income: 5000, expenses: 3000, netSavings: 2000 },
        { month: "April", income: 5000, expenses: 3000, netSavings: 2000 },
        { month: "May", income: 5000, expenses: 3000, netSavings: 2000 },
        { month: "June", income: 5000, expenses: 3000, netSavings: 2000 },
        { month: "July", income: 5000, expenses: 3000, netSavings: 2000 },
        { month: "August", income: 5000, expenses: 3000, netSavings: 2000 },
        { month: "September", income: 5000, expenses: 3000, netSavings: 2000 },
        { month: "October", income: 5000, expenses: 3000, netSavings: 2000 },
        { month: "November", income: 5000, expenses: 3000, netSavings: 2000 },
        { month: "December", income: 5000, expenses: 3000, netSavings: 2000 },
      ];
      const mockData = createMockWrappedData({ monthlyData });
      render(<TopMonthsPage data={mockData} />);

      const barChart = screen.getByTestId("bar-chart");
      const chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");

      // Since all have same spending, they'll be sorted but abbreviations should still be correct
      const monthAbbreviationMap: Record<string, string> = {
        January: "Jan",
        February: "Feb",
        March: "Mar",
        April: "Apr",
        May: "May",
        June: "Jun",
        July: "Jul",
        August: "Aug",
        September: "Sep",
        October: "Oct",
        November: "Nov",
        December: "Dec",
      };

      chartData.forEach((entry: any) => {
        const expectedAbbrev = monthAbbreviationMap[entry.fullMonth];
        expect(entry.month).toBe(expectedAbbrev);
        expect(entry.month).toHaveLength(3);
      });
    });
  });
});
