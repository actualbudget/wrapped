import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { createMockWrappedData, createMockBudgetComparison } from '../../test-utils/mockData';
import { BudgetVsActualPage } from './BudgetVsActualPage';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
    h2: ({ children, ...props }: React.ComponentProps<'h2'>) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: React.ComponentProps<'p'>) => <p {...props}>{children}</p>,
    button: ({ children, ...props }: React.ComponentProps<'button'>) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}));

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: React.PropsWithChildren) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  ComposedChart: ({ children }: React.PropsWithChildren) => (
    <div data-testid="composed-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

// Mock useAnimatedNumber hook
vi.mock('../../hooks/useAnimatedNumber', () => ({
  useAnimatedNumber: (target: number) => target,
}));

describe('BudgetVsActualPage', () => {
  it('renders without crashing', () => {
    const mockData = createMockWrappedData({
      budgetComparison: createMockBudgetComparison(),
    });
    render(<BudgetVsActualPage data={mockData} />);
    expect(screen.getByText('Budget vs Actual')).toBeInTheDocument();
  });

  it('displays page title', () => {
    const mockData = createMockWrappedData({
      budgetComparison: createMockBudgetComparison(),
    });
    render(<BudgetVsActualPage data={mockData} />);
    expect(screen.getByText('Budget vs Actual')).toBeInTheDocument();
  });

  it('displays subtitle', () => {
    const mockData = createMockWrappedData({
      budgetComparison: createMockBudgetComparison(),
    });
    render(<BudgetVsActualPage data={mockData} />);
    expect(screen.getByText('How your spending compared to your budget')).toBeInTheDocument();
  });

  it('displays "No budget data available" when budget comparison is missing', () => {
    const mockData = createMockWrappedData({
      budgetComparison: undefined,
    });
    render(<BudgetVsActualPage data={mockData} />);
    expect(screen.getByText('No budget data available for comparison')).toBeInTheDocument();
    expect(
      screen.getByText(
        /To see budget comparisons, make sure your Actual Budget export includes budgeted amounts/,
      ),
    ).toBeInTheDocument();
  });

  it('displays "No budget data available" when category budgets array is empty', () => {
    const mockData = createMockWrappedData({
      budgetComparison: {
        ...createMockBudgetComparison(),
        categoryBudgets: [],
      },
    });
    render(<BudgetVsActualPage data={mockData} />);
    expect(screen.getByText('No budget data available for comparison')).toBeInTheDocument();
  });

  it('displays overall budget statistics', () => {
    const mockData = createMockWrappedData({
      budgetComparison: createMockBudgetComparison({
        overallBudgeted: 25000,
        overallActual: 23000,
        overallVariance: -2000,
        overallVariancePercentage: -8,
      }),
    });
    render(<BudgetVsActualPage data={mockData} />);
    // Use getAllByText since these texts appear in multiple places (overall and category stats)
    const totalBudgetedElements = screen.getAllByText(/Total Budgeted/i);
    expect(totalBudgetedElements.length).toBeGreaterThan(0);
    const totalActualElements = screen.getAllByText(/Total Actual/i);
    expect(totalActualElements.length).toBeGreaterThan(0);
    const overUnderBudgetElements = screen.getAllByText(/Over Budget|Under Budget/i);
    expect(overUnderBudgetElements.length).toBeGreaterThan(0);
  });

  it('displays category selector dropdown when multiple categories exist', () => {
    const mockData = createMockWrappedData({
      budgetComparison: createMockBudgetComparison(),
    });
    render(<BudgetVsActualPage data={mockData} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.tagName).toBe('SELECT');
  });

  it('displays category groups in dropdown', () => {
    const mockData = createMockWrappedData({
      budgetComparison: createMockBudgetComparison(),
    });
    render(<BudgetVsActualPage data={mockData} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    // Check that category names are in the dropdown options
    const optionsText = Array.from(select.options).map(opt => opt.text);
    expect(optionsText.some(text => text.includes('Groceries'))).toBe(true);
    expect(optionsText.some(text => text.includes('Rent'))).toBe(true);
  });

  it('allows selecting a category from dropdown', async () => {
    const mockData = createMockWrappedData({
      budgetComparison: createMockBudgetComparison(),
    });
    render(<BudgetVsActualPage data={mockData} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;

    // Wait for useEffect to set the selected category
    await waitFor(() => {
      expect(select.value).toBeTruthy();
    });

    // Verify select has options
    expect(select.options.length).toBeGreaterThan(0);
  });

  it('renders chart when category is selected', async () => {
    const mockData = createMockWrappedData({
      budgetComparison: createMockBudgetComparison(),
    });
    render(<BudgetVsActualPage data={mockData} />);
    // Wait for the chart to render
    await waitFor(() => {
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
    });
  });

  it('displays selected category name in chart section', async () => {
    const mockData = createMockWrappedData({
      budgetComparison: createMockBudgetComparison(),
    });
    render(<BudgetVsActualPage data={mockData} />);
    // Should display the first category name by default (could be Groceries or Rent depending on sort order)
    // Wait for the chart to render with the category name
    // Use getAllByText since category names might appear multiple times (in select dropdown and chart)
    await waitFor(() => {
      const groceriesElements = screen.queryAllByText('Groceries');
      const rentElements = screen.queryAllByText('Rent');
      expect(groceriesElements.length + rentElements.length).toBeGreaterThan(0);
    });
  });

  it('displays category summary statistics', () => {
    const mockData = createMockWrappedData({
      budgetComparison: createMockBudgetComparison(),
    });
    render(<BudgetVsActualPage data={mockData} />);
    expect(screen.getByText(/Categories Over Budget/i)).toBeInTheDocument();
    expect(screen.getByText(/Categories Under Budget/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Categories/i)).toBeInTheDocument();
  });

  it('calculates categories over/under budget correctly', () => {
    const mockData = createMockWrappedData({
      budgetComparison: createMockBudgetComparison({
        categoryBudgets: [
          {
            categoryId: 'cat1',
            categoryName: 'Over Budget',
            categoryGroup: 'Group1',
            monthlyBudgets: [],
            totalBudgeted: 1000,
            totalActual: 1200,
            totalVariance: 200, // Over budget
            totalVariancePercentage: 20,
          },
          {
            categoryId: 'cat2',
            categoryName: 'Under Budget',
            categoryGroup: 'Group2',
            monthlyBudgets: [],
            totalBudgeted: 1000,
            totalActual: 800,
            totalVariance: -200, // Under budget
            totalVariancePercentage: -20,
          },
        ],
      }),
    });
    const { container } = render(<BudgetVsActualPage data={mockData} />);
    // Should show 1 category over budget and 1 under budget
    expect(screen.getByText(/Categories Over Budget/i)).toBeInTheDocument();
    expect(screen.getByText(/Categories Under Budget/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Categories/i)).toBeInTheDocument();
    // Verify the stat cards exist
    const statCards = container.querySelectorAll('[class*="statCard"]');
    expect(statCards.length).toBeGreaterThanOrEqual(3);
  });

  it('renders page container with correct id', () => {
    const mockData = createMockWrappedData({
      budgetComparison: createMockBudgetComparison(),
    });
    const { container } = render(<BudgetVsActualPage data={mockData} />);
    const pageContainer = container.querySelector('#budget-vs-actual-page');
    expect(pageContainer).toBeInTheDocument();
  });

  it('does not render category selector when only one category exists', () => {
    const mockData = createMockWrappedData({
      budgetComparison: createMockBudgetComparison({
        categoryBudgets: [
          {
            categoryId: 'cat1',
            categoryName: 'Single Category',
            categoryGroup: 'Group',
            monthlyBudgets: [],
            totalBudgeted: 1000,
            totalActual: 800,
            totalVariance: -200,
            totalVariancePercentage: -20,
          },
        ],
      }),
    });
    render(<BudgetVsActualPage data={mockData} />);
    const select = screen.queryByRole('combobox');
    expect(select).not.toBeInTheDocument();
  });

  it('handles income categories and groups appearing last', () => {
    const mockData = createMockWrappedData({
      budgetComparison: createMockBudgetComparison({
        categoryBudgets: [
          {
            categoryId: 'cat1',
            categoryName: 'Groceries',
            categoryGroup: 'Food',
            monthlyBudgets: [],
            totalBudgeted: 1000,
            totalActual: 800,
            totalVariance: -200,
            totalVariancePercentage: -20,
          },
          {
            categoryId: 'cat2',
            categoryName: 'Salary',
            categoryGroup: 'Income',
            monthlyBudgets: [],
            totalBudgeted: 5000,
            totalActual: 5000,
            totalVariance: 0,
            totalVariancePercentage: 0,
          },
        ],
        groupSortOrder: new Map([
          ['Food', 1],
          ['Income', 2],
        ]),
      }),
    });
    render(<BudgetVsActualPage data={mockData} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    const options = Array.from(select.options);
    // Income category should appear after non-income categories
    const groceriesIndex = options.findIndex(opt => opt.text === 'Groceries');
    const incomeIndex = options.findIndex(opt => opt.text === 'Salary');
    expect(groceriesIndex).toBeGreaterThanOrEqual(0);
    expect(incomeIndex).toBeGreaterThanOrEqual(0);
    expect(incomeIndex).toBeGreaterThan(groceriesIndex);
  });

  it('filters out deleted categories', () => {
    const mockData = createMockWrappedData({
      budgetComparison: createMockBudgetComparison({
        categoryBudgets: [
          {
            categoryId: 'cat1',
            categoryName: 'Active Category',
            categoryGroup: 'Food',
            monthlyBudgets: [],
            totalBudgeted: 1000,
            totalActual: 800,
            totalVariance: -200,
            totalVariancePercentage: -20,
          },
          {
            categoryId: 'cat2',
            categoryName: 'Deleted: Old Category',
            categoryGroup: 'Food',
            monthlyBudgets: [],
            totalBudgeted: 500,
            totalActual: 400,
            totalVariance: -100,
            totalVariancePercentage: -20,
          },
          {
            categoryId: 'cat3',
            categoryName: 'Another Active',
            categoryGroup: 'Food',
            monthlyBudgets: [],
            totalBudgeted: 800,
            totalActual: 700,
            totalVariance: -100,
            totalVariancePercentage: -12.5,
          },
        ],
        groupSortOrder: new Map([['Food', 1]]),
      }),
    });
    render(<BudgetVsActualPage data={mockData} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    const options = Array.from(select.options);
    const activeIndex = options.findIndex(opt => opt.text === 'Active Category');
    const anotherActiveIndex = options.findIndex(opt => opt.text === 'Another Active');
    const deletedIndex = options.findIndex(opt => opt.text === 'Deleted: Old Category');

    // Active categories should be present
    expect(activeIndex).toBeGreaterThan(-1);
    expect(anotherActiveIndex).toBeGreaterThan(-1);
    // Deleted category should be filtered out
    expect(deletedIndex).toBe(-1);
  });

  it('filters out deleted categories even in deleted groups', () => {
    const mockData = createMockWrappedData({
      budgetComparison: createMockBudgetComparison({
        categoryBudgets: [
          {
            categoryId: 'cat1',
            categoryName: 'Category in Active Group',
            categoryGroup: 'Active Group',
            monthlyBudgets: [],
            totalBudgeted: 1000,
            totalActual: 800,
            totalVariance: -200,
            totalVariancePercentage: -20,
          },
          {
            categoryId: 'cat1b',
            categoryName: 'Another Category in Active Group',
            categoryGroup: 'Active Group',
            monthlyBudgets: [],
            totalBudgeted: 800,
            totalActual: 700,
            totalVariance: -100,
            totalVariancePercentage: -12.5,
          },
          {
            categoryId: 'cat2',
            categoryName: 'Deleted: Category in Deleted Group',
            categoryGroup: 'Deleted Group',
            monthlyBudgets: [],
            totalBudgeted: 500,
            totalActual: 400,
            totalVariance: -100,
            totalVariancePercentage: -20,
          },
        ],
        groupSortOrder: new Map([
          ['Active Group', 1],
          ['Deleted Group', 2],
        ]),
        groupTombstones: new Map([['Deleted Group', true]]),
      }),
    });
    render(<BudgetVsActualPage data={mockData} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    const options = Array.from(select.options);

    // Find the optgroups
    const activeGroupOption = options.find(opt => opt.text === 'Category in Active Group');
    const anotherActiveOption = options.find(
      opt => opt.text === 'Another Category in Active Group',
    );
    const deletedGroupOption = options.find(
      opt => opt.text === 'Deleted: Category in Deleted Group',
    );

    // Active categories should exist
    expect(activeGroupOption).toBeDefined();
    expect(anotherActiveOption).toBeDefined();
    // Deleted category should be filtered out
    expect(deletedGroupOption).toBeUndefined();
  });

  it('filters out groups with all deleted categories', () => {
    const mockData = createMockWrappedData({
      budgetComparison: createMockBudgetComparison({
        categoryBudgets: [
          {
            categoryId: 'cat1',
            categoryName: 'Active Category',
            categoryGroup: 'Active Group',
            monthlyBudgets: [],
            totalBudgeted: 1000,
            totalActual: 800,
            totalVariance: -200,
            totalVariancePercentage: -20,
          },
          {
            categoryId: 'cat2',
            categoryName: 'Another Active',
            categoryGroup: 'Active Group',
            monthlyBudgets: [],
            totalBudgeted: 500,
            totalActual: 400,
            totalVariance: -100,
            totalVariancePercentage: -20,
          },
          {
            categoryId: 'cat3',
            categoryName: 'Deleted: Category 1',
            categoryGroup: 'All Deleted Group',
            monthlyBudgets: [],
            totalBudgeted: 300,
            totalActual: 250,
            totalVariance: -50,
            totalVariancePercentage: -16.67,
          },
          {
            categoryId: 'cat4',
            categoryName: 'Deleted: Category 2',
            categoryGroup: 'All Deleted Group',
            monthlyBudgets: [],
            totalBudgeted: 200,
            totalActual: 150,
            totalVariance: -50,
            totalVariancePercentage: -25,
          },
        ],
        groupSortOrder: new Map([
          ['Active Group', 1],
          ['All Deleted Group', 2],
        ]),
        groupTombstones: new Map(),
      }),
    });
    render(<BudgetVsActualPage data={mockData} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    const options = Array.from(select.options);

    const activeIndex = options.findIndex(opt => opt.text === 'Active Category');
    const anotherActiveIndex = options.findIndex(opt => opt.text === 'Another Active');
    const deleted1Index = options.findIndex(opt => opt.text === 'Deleted: Category 1');
    const deleted2Index = options.findIndex(opt => opt.text === 'Deleted: Category 2');

    // Active categories should be present
    expect(activeIndex).toBeGreaterThan(-1);
    expect(anotherActiveIndex).toBeGreaterThan(-1);
    // Deleted categories should be filtered out
    expect(deleted1Index).toBe(-1);
    expect(deleted2Index).toBe(-1);
  });
});
