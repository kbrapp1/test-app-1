import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmationDialog, ConfirmationDialogProps } from './ConfirmationDialog';
import { vi } from 'vitest';

const mockOnOpenChange = vi.fn();
const mockOnConfirm = vi.fn();

const defaultProps: ConfirmationDialogProps = {
  isOpen: true,
  onOpenChange: mockOnOpenChange,
  title: 'Confirm Action',
  description: 'Are you sure you want to proceed?',
  onConfirm: mockOnConfirm,
};

const TestWrapper: React.FC<Partial<ConfirmationDialogProps>> = (props) => {
  return <ConfirmationDialog {...defaultProps} {...props} />;
};

describe('ConfirmationDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    render(<TestWrapper />);
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    // Default confirm button text is 'Confirm', but variant is 'destructive' by default
    // which might imply a default text like 'Delete' if not overridden.
    // Let's check for 'Confirm' as per default prop value.
    expect(screen.getByRole('button', { name: /Confirm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    mockOnConfirm.mockResolvedValueOnce(undefined);
    render(<TestWrapper />);
    await user.click(screen.getByRole('button', { name: /Confirm/i }));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenChange(false) when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);
    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('displays custom button text and variant if provided', () => {
    render(
      <TestWrapper 
        confirmButtonText="ProceedNow"
        cancelButtonText="GoBack"
        confirmButtonVariant="default"
      />
    );
    const confirmButton = screen.getByRole('button', { name: /ProceedNow/i });
    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton).not.toHaveClass('bg-destructive'); // Check if not default destructive
    expect(screen.getByRole('button', { name: /GoBack/i })).toBeInTheDocument();
  });

  it('displays loading state when isLoading prop is true', () => {
    render(<TestWrapper isLoading={true} />);
    const confirmButton = screen.getByRole('button', { name: /Processing.../i });
    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton).toBeDisabled();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();
  });

  it('renders ReactNode description correctly', () => {
    const complexDescription = (
      <p>
        This is a <strong>complex</strong> description with <a href="#">a link</a>.
      </p>
    );
    render(<TestWrapper description={complexDescription} />);
    
    const descriptionElement = screen.getByText((content, node) => {
      const P_TAG = "P";
      const hasText = node?.textContent?.startsWith('This is a complex description');
      return node?.tagName === P_TAG && hasText === true;
    });
    expect(descriptionElement).toBeInTheDocument();

    expect(screen.getByText('complex', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /a link/i })).toBeInTheDocument();
  });

  // Test for AlertDialog specific behavior if any, e.g., focus trapping, Escape key close.
  // These are often handled by the underlying Radix/Shadcn component, but a smoke test can be useful.
  it('closes with Escape key (basic check, relies on underlying AlertDialog)', () => {
    render(<TestWrapper />);
    fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape', code: 'Escape' });
    // Assuming AlertDialog calls onOpenChange when closed by Escape
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
}); 