import { describe, it, expect, vi } from 'vitest';

import { render, screen, fireEvent } from '../test-utils/test-utils';
import { OnBudgetTransfersToggle } from './OnBudgetTransfersToggle';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
  },
}));

describe('OnBudgetTransfersToggle', () => {
  it('renders without crashing', () => {
    const mockToggle = vi.fn();
    render(<OnBudgetTransfersToggle includeOnBudgetTransfers={false} onToggle={mockToggle} />);

    expect(screen.getByText('Include Budgeted Transfers')).toBeInTheDocument();
  });

  it('displays toggle switch', () => {
    const mockToggle = vi.fn();
    render(<OnBudgetTransfersToggle includeOnBudgetTransfers={false} onToggle={mockToggle} />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('shows active state when includeOnBudgetTransfers is true', () => {
    const mockToggle = vi.fn();
    render(<OnBudgetTransfersToggle includeOnBudgetTransfers={true} onToggle={mockToggle} />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onToggle when clicked', () => {
    const mockToggle = vi.fn();
    render(<OnBudgetTransfersToggle includeOnBudgetTransfers={false} onToggle={mockToggle} />);

    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    expect(mockToggle).toHaveBeenCalledTimes(1);
    expect(mockToggle).toHaveBeenCalledWith(true);
  });

  it('calls onToggle with false when toggling from true to false', () => {
    const mockToggle = vi.fn();
    render(<OnBudgetTransfersToggle includeOnBudgetTransfers={true} onToggle={mockToggle} />);

    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    expect(mockToggle).toHaveBeenCalledTimes(1);
    expect(mockToggle).toHaveBeenCalledWith(false);
  });

  it('calls onToggle when Enter key is pressed', () => {
    const mockToggle = vi.fn();
    render(<OnBudgetTransfersToggle includeOnBudgetTransfers={false} onToggle={mockToggle} />);

    const toggle = screen.getByRole('switch');
    toggle.focus();
    fireEvent.keyDown(toggle, { key: 'Enter', code: 'Enter' });

    expect(mockToggle).toHaveBeenCalledTimes(1);
    expect(mockToggle).toHaveBeenCalledWith(true);
  });

  it('calls onToggle when Space key is pressed', () => {
    const mockToggle = vi.fn();
    render(<OnBudgetTransfersToggle includeOnBudgetTransfers={false} onToggle={mockToggle} />);

    const toggle = screen.getByRole('switch');
    toggle.focus();
    fireEvent.keyDown(toggle, { key: ' ', code: 'Space' });

    expect(mockToggle).toHaveBeenCalledTimes(1);
    expect(mockToggle).toHaveBeenCalledWith(true);
  });

  it('has correct aria-label', () => {
    const mockToggle = vi.fn();
    render(<OnBudgetTransfersToggle includeOnBudgetTransfers={false} onToggle={mockToggle} />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-label', 'Include budgeted transfers');
  });

  describe('disabled state', () => {
    it('does not call onToggle when disabled and clicked', () => {
      const mockToggle = vi.fn();
      render(
        <OnBudgetTransfersToggle
          includeOnBudgetTransfers={false}
          onToggle={mockToggle}
          disabled={true}
        />,
      );

      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);

      expect(mockToggle).not.toHaveBeenCalled();
    });

    it('has aria-disabled when disabled', () => {
      const mockToggle = vi.fn();
      render(
        <OnBudgetTransfersToggle
          includeOnBudgetTransfers={false}
          onToggle={mockToggle}
          disabled={true}
        />,
      );

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-disabled', 'true');
    });

    it('has tabIndex of -1 when disabled', () => {
      const mockToggle = vi.fn();
      render(
        <OnBudgetTransfersToggle
          includeOnBudgetTransfers={false}
          onToggle={mockToggle}
          disabled={true}
        />,
      );

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('tabIndex', '-1');
    });

    it('does not call onToggle when disabled and Enter key is pressed', () => {
      const mockToggle = vi.fn();
      render(
        <OnBudgetTransfersToggle
          includeOnBudgetTransfers={false}
          onToggle={mockToggle}
          disabled={true}
        />,
      );

      const toggle = screen.getByRole('switch');
      toggle.focus();
      fireEvent.keyDown(toggle, { key: 'Enter', code: 'Enter' });

      expect(mockToggle).not.toHaveBeenCalled();
    });
  });
});
