import { describe, it, expect, vi } from 'vitest';

import { render, screen, fireEvent } from '../test-utils/test-utils';
import { AllTransfersToggle } from './OffBudgetTransfersToggle';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
  },
}));

describe('AllTransfersToggle', () => {
  it('renders without crashing', () => {
    const mockToggle = vi.fn();
    render(<AllTransfersToggle includeAllTransfers={false} onToggle={mockToggle} />);

    expect(screen.getByText('Include All Transfers')).toBeInTheDocument();
  });

  it('displays toggle switch', () => {
    const mockToggle = vi.fn();
    render(<AllTransfersToggle includeAllTransfers={false} onToggle={mockToggle} />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('shows active state when includeAllTransfers is true', () => {
    const mockToggle = vi.fn();
    render(<AllTransfersToggle includeAllTransfers={true} onToggle={mockToggle} />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onToggle when clicked', () => {
    const mockToggle = vi.fn();
    render(<AllTransfersToggle includeAllTransfers={false} onToggle={mockToggle} />);

    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    expect(mockToggle).toHaveBeenCalledTimes(1);
    expect(mockToggle).toHaveBeenCalledWith(true);
  });

  it('calls onToggle with false when toggling from true to false', () => {
    const mockToggle = vi.fn();
    render(<AllTransfersToggle includeAllTransfers={true} onToggle={mockToggle} />);

    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    expect(mockToggle).toHaveBeenCalledTimes(1);
    expect(mockToggle).toHaveBeenCalledWith(false);
  });

  it('calls onToggle when Enter key is pressed', () => {
    const mockToggle = vi.fn();
    render(<AllTransfersToggle includeAllTransfers={false} onToggle={mockToggle} />);

    const toggle = screen.getByRole('switch');
    toggle.focus();
    fireEvent.keyDown(toggle, { key: 'Enter', code: 'Enter' });

    expect(mockToggle).toHaveBeenCalledTimes(1);
    expect(mockToggle).toHaveBeenCalledWith(true);
  });

  it('calls onToggle when Space key is pressed', () => {
    const mockToggle = vi.fn();
    render(<AllTransfersToggle includeAllTransfers={false} onToggle={mockToggle} />);

    const toggle = screen.getByRole('switch');
    toggle.focus();
    fireEvent.keyDown(toggle, { key: ' ', code: 'Space' });

    expect(mockToggle).toHaveBeenCalledTimes(1);
    expect(mockToggle).toHaveBeenCalledWith(true);
  });

  it('has correct aria-label', () => {
    const mockToggle = vi.fn();
    render(<AllTransfersToggle includeAllTransfers={false} onToggle={mockToggle} />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-label', 'Include all transfers');
  });
});
