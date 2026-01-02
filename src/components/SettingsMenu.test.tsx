import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { render, screen, fireEvent } from '../test-utils/test-utils';
import { SettingsMenu } from './SettingsMenu';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: React.ComponentProps<'button'>) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

describe('SettingsMenu', () => {
  beforeEach(() => {
    // Clear any existing event listeners
    document.removeEventListener('mousedown', vi.fn());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <SettingsMenu>
        <div>Test Content</div>
      </SettingsMenu>,
    );

    expect(screen.getByLabelText('Toggle settings menu')).toBeInTheDocument();
  });

  it('renders settings button', () => {
    render(
      <SettingsMenu>
        <div>Test Content</div>
      </SettingsMenu>,
    );

    const button = screen.getByLabelText('Toggle settings menu');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('settings')).toBeInTheDocument();
  });

  it('shows menu when settings button is clicked', () => {
    render(
      <SettingsMenu>
        <div>Test Content</div>
      </SettingsMenu>,
    );

    const button = screen.getByLabelText('Toggle settings menu');
    fireEvent.click(button);

    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('hides menu when settings button is clicked again', () => {
    render(
      <SettingsMenu>
        <div>Test Content</div>
      </SettingsMenu>,
    );

    const button = screen.getByLabelText('Toggle settings menu');

    // Open menu
    fireEvent.click(button);
    expect(screen.getByText('Test Content')).toBeInTheDocument();

    // Close menu
    fireEvent.click(button);
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders children when menu is open', () => {
    render(
      <SettingsMenu>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </SettingsMenu>,
    );

    const button = screen.getByLabelText('Toggle settings menu');
    fireEvent.click(button);

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('Child 3')).toBeInTheDocument();
  });

  it('closes menu when clicking outside', () => {
    render(
      <SettingsMenu>
        <div>Test Content</div>
      </SettingsMenu>,
    );

    const button = screen.getByLabelText('Toggle settings menu');

    // Open menu
    fireEvent.click(button);
    expect(screen.getByText('Test Content')).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(document.body);

    // Menu should be closed
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
  });

  it('does not close menu when clicking inside', () => {
    render(
      <SettingsMenu>
        <div>Test Content</div>
      </SettingsMenu>,
    );

    const button = screen.getByLabelText('Toggle settings menu');

    // Open menu
    fireEvent.click(button);
    expect(screen.getByText('Test Content')).toBeInTheDocument();

    // Click inside menu
    const content = screen.getByText('Test Content');
    fireEvent.mouseDown(content);

    // Menu should still be open
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders multiple children correctly', () => {
    render(
      <SettingsMenu>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </SettingsMenu>,
    );

    const button = screen.getByLabelText('Toggle settings menu');
    fireEvent.click(button);

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('starts with menu closed', () => {
    render(
      <SettingsMenu>
        <div>Test Content</div>
      </SettingsMenu>,
    );

    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
  });
});
