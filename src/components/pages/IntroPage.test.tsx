import { describe, it, expect, vi } from 'vitest';

import { createMockWrappedData } from '../../test-utils/mockData';
import { render, screen } from '../../test-utils/test-utils';
import { IntroPage } from './IntroPage';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: React.ComponentProps<'h1'>) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: React.ComponentProps<'p'>) => <p {...props}>{children}</p>,
    strong: ({ children, ...props }: React.ComponentProps<'strong'>) => (
      <strong {...props}>{children}</strong>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}));

describe('IntroPage', () => {
  it('renders without crashing', () => {
    const mockData = createMockWrappedData();
    render(<IntroPage data={mockData} />);

    expect(screen.getByText(/Your.*Budget/)).toBeInTheDocument();
  });

  it('displays correct year', () => {
    const mockData = createMockWrappedData({ year: 2025 });
    render(<IntroPage data={mockData} />);

    expect(screen.getByText('Your 2025 Budget')).toBeInTheDocument();
  });

  it('displays year in review subtitle', () => {
    const mockData = createMockWrappedData();
    render(<IntroPage data={mockData} />);

    expect(screen.getByText('Year in Review')).toBeInTheDocument();
  });

  it('displays transaction count', () => {
    const mockTransactions = Array(150)
      .fill(null)
      .map((_, i) => ({
        id: `trans-${i}`,
        account: 'acc1',
        date: '2025-01-01',
        amount: -1000,
      }));
    const mockData = createMockWrappedData({
      allTransactions: mockTransactions,
    });
    render(<IntroPage data={mockData} />);

    expect(screen.getByText(/150/)).toBeInTheDocument();
    expect(screen.getByText(/transactions/)).toBeInTheDocument();
  });

  it('displays month count', () => {
    const mockData = createMockWrappedData({
      monthlyData: [
        { month: 'January', income: 5000, expenses: 3000, netSavings: 2000 },
        { month: 'February', income: 5000, expenses: 3000, netSavings: 2000 },
        { month: 'March', income: 5000, expenses: 3000, netSavings: 2000 },
      ],
    });
    render(<IntroPage data={mockData} />);

    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText(/months/)).toBeInTheDocument();
  });

  it('displays call to action text', () => {
    const mockData = createMockWrappedData();
    render(<IntroPage data={mockData} />);

    expect(screen.getByText(/Lets see how you did/)).toBeInTheDocument();
    expect(screen.getByText(/Click/)).toBeInTheDocument();
    expect(screen.getByText(/Next/)).toBeInTheDocument();
  });

  it('handles missing transactions', () => {
    const mockData = createMockWrappedData({
      allTransactions: undefined,
    });
    render(<IntroPage data={mockData} />);

    // Check that transactions text appears (even if count is 0)
    expect(screen.getByText(/transactions/)).toBeInTheDocument();
    // The page should still render without crashing
    expect(screen.getByText(/Your.*Budget/)).toBeInTheDocument();
  });

  it('renders page container with correct id', () => {
    const mockData = createMockWrappedData();
    const { container } = render(<IntroPage data={mockData} />);

    const pageContainer = container.querySelector('#intro-page');
    expect(pageContainer).toBeInTheDocument();
  });
});
