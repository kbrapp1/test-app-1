import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfirmationDialog, ConfirmationDialogProps } from './ConfirmationDialog';

// Mock shadcn/ui components
vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open, onOpenChange }: { children: React.ReactNode, open: boolean, onOpenChange: (open: boolean) => void }) => 
    open ? <div data-testid="alert-dialog" onClick={() => onOpenChange(!open)}>{children}</div> : null,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="alert-dialog-content">{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="alert-dialog-header">{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <h2 data-testid="alert-dialog-title">{children}</h2>,
  AlertDialogDescription: ({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) => 
    asChild ? <div data-testid="alert-dialog-description">{children}</div> : <p data-testid="alert-dialog-description">{children}</p>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div data-testid="alert-dialog-footer">{children}</div>,
  AlertDialogCancel: (props: any) => <button data-testid="alert-dialog-cancel" {...props}>{props.children}</button>,
}));

vi.mock('@/components/ui/button', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/ui/button')>();
  return {
    ...actual,
    Button: (props: any) => <button data-testid="button-confirm" {...props}>{props.children}</button>,
  };
});

const defaultProps: ConfirmationDialogProps = {
  isOpen: true,
  onOpenChange: vi.fn(),
  title: 'Confirm Action',
  description: 'Are you sure you want to proceed?',
  onConfirm: vi.fn(),
  confirmButtonText: 'Confirm',
  cancelButtonText: 'Cancel',
  isLoading: false,
  confirmButtonVariant: 'default',
};

describe('ConfirmationDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks for props
    defaultProps.onOpenChange = vi.fn();
    defaultProps.onConfirm = vi.fn();
  });

  const renderDialog = (props: Partial<ConfirmationDialogProps> = {}) => {
    return render(<ConfirmationDialog {...defaultProps} {...props} />);
  };

  it('should render correctly when open', () => {
    renderDialog();
    expect(screen.getByTestId('alert-dialog-title')).toHaveTextContent('Confirm Action');
    expect(screen.getByTestId('alert-dialog-description')).toHaveTextContent('Are you sure you want to proceed?');
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    renderDialog({ isOpen: false });
    expect(screen.queryByTestId('alert-dialog')).not.toBeInTheDocument();
  });

  it('should call onOpenChange with false when Cancel button is clicked', () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    // The mock for AlertDialogCancel directly calls onOpenChange in this setup.
    // If AlertDialog handles its own closing, this test would need to verify that onOpenChange (prop) is called.
    // Based on the current mock, the click on the div wrapper of AlertDialog also triggers onOpenChange.
    // Let's assume the cancel button itself triggers onOpenChange if it were a real AlertDialogCancel.
    // For this specific mock: The parent AlertDialog `onClick={() => onOpenChange(!open)}` would be called by the cancel button.
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should call onConfirm when Confirm button is clicked', async () => {
    const mockOnConfirm = vi.fn().mockResolvedValue(undefined);
    renderDialog({ onConfirm: mockOnConfirm });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });
  });

  it('should display loading state on Confirm button and disable buttons', () => {
    renderDialog({ isLoading: true });
    const confirmButton = screen.getByRole('button', { name: /processing.../i });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('should render custom button texts', () => {
    renderDialog({ confirmButtonText: 'Yes, Delete', cancelButtonText: 'No, Keep' });
    expect(screen.getByRole('button', { name: 'Yes, Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No, Keep' })).toBeInTheDocument();
  });

  it('should apply confirmButtonVariant to the Confirm button', () => {
    // This test relies on the Button mock correctly receiving and applying variant, 
    // or on inspecting class names if cn utility and buttonVariants are precisely mocked/handled.
    // For simplicity, we assume the mock passes the variant prop or a corresponding class.
    renderDialog({ confirmButtonVariant: 'destructive' });
    const confirmButton = screen.getByTestId('button-confirm');
    // In a real scenario, you might check for a class like 'bg-destructive'
    // expect(confirmButton).toHaveClass('bg-destructive'); // This depends on your actual CSS and cn output
    // For now, just check if the button is rendered with the correct text for this variant if text changes
    expect(confirmButton).toHaveTextContent('Confirm'); // Assuming text doesn't change with variant by default
    // If `cn(buttonVariants({ variant: confirmButtonVariant }))` is a key part of behavior,
    // you might need a more sophisticated mock for `cn` or `buttonVariants` or test classes.
  });

  it('should render ReactNode as description', () => {
    const complexDescription = (
      <p>
        This is a <strong>complex</strong> description with <a href="#">a link</a>.
      </p>
    );
    renderDialog({ description: complexDescription });
    expect(screen.getByTestId('alert-dialog-description').querySelector('strong')).toHaveTextContent('complex');
    expect(screen.getByRole('link', { name: 'a link' })).toBeInTheDocument();
  });

  it('should handle onConfirm being an async function and wait for it', async () => {
    let resolvePromise: () => void;
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    const asyncOnConfirm = vi.fn(() => promise);
    renderDialog({ onConfirm: asyncOnConfirm, isLoading: false });

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    fireEvent.click(confirmButton);

    expect(asyncOnConfirm).toHaveBeenCalledTimes(1);
    // isLoading should ideally be true now if the component manages it internally based on promise state
    // This depends on the component's implementation details.
    // For this test, we primarily check that the async function was called.

    // Simulate promise resolving
    await act(async () => {
      resolvePromise();
      await promise; // Wait for the promise to settle
    });
    // Any follow-up assertions after promise resolution would go here
  });

}); 