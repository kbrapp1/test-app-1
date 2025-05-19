import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InputDialog, InputDialogProps } from './InputDialog'; // Assuming InputDialogProps is exported

// Mock shadcn/ui components if they are not vital to the logic being tested
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: { children: React.ReactNode, open: boolean, onOpenChange: (open: boolean) => void }) => 
    open ? <div data-testid="dialog" onClick={() => onOpenChange(!open)}>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p data-testid="dialog-description">{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-footer">{children}</div>,
  DialogClose: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input data-testid="input" {...props} />,
}));

vi.mock('@/components/ui/button', () => ({
  Button: (props: any) => <button data-testid="button" {...props}>{props.children}</button>,
}));


const defaultProps: InputDialogProps = {
  isOpen: true,
  onOpenChange: vi.fn(),
  title: 'Test Input Dialog',
  description: 'This is a test description.',
  initialValue: 'initial',
  onSubmit: vi.fn(),
  inputPlaceholder: 'Enter value',
  submitButtonText: 'Submit',
  isLoading: false,
};

describe('InputDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultProps.onOpenChange = vi.fn();
    defaultProps.onSubmit = vi.fn();
  });

  const renderInputDialog = (props: Partial<InputDialogProps> = {}) => {
    return render(<InputDialog {...defaultProps} {...props} />);
  };

  it('should render correctly when open', () => {
    renderInputDialog();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Test Input Dialog');
    expect(screen.getByTestId('dialog-description')).toHaveTextContent('This is a test description.');
    expect(screen.getByTestId('input')).toHaveValue('initial');
    expect(screen.getByTestId('input')).toHaveAttribute('placeholder', 'Enter value');
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    renderInputDialog({ isOpen: false });
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('should call onOpenChange with false when Cancel button is clicked', () => {
    renderInputDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should update input value on change', () => {
    renderInputDialog();
    const input = screen.getByTestId('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'new value' } });
    expect(input.value).toBe('new value');
  });

  it('should call onSubmit with the current input value when submit button is clicked', async () => {
    renderInputDialog();
    const input = screen.getByTestId('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'submitted value' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith('submitted value');
    });
  });

  it('should call onSubmit with the initial value if input is not changed', async () => {
    renderInputDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith('initial');
    });
  });

  it('should display loading state on submit button', () => {
    renderInputDialog({ isLoading: true });
    const submitButton = screen.getByRole('button', { name: 'Processing...' });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    // Check for loading spinner if your Button component renders one
    // expect(submitButton.querySelector('.lucide-loader-2')).toBeInTheDocument();
  });

  it('should reset input to initialValue when dialog reopens if not persistent or unmounted', () => {
    const { rerender } = renderInputDialog({ initialValue: 'first' });
    let input = screen.getByTestId('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'changed' } });
    expect(input.value).toBe('changed');

    // Simulate closing and reopening with a new initialValue
    rerender(<InputDialog {...defaultProps} isOpen={false} initialValue="second" />);
    rerender(<InputDialog {...defaultProps} isOpen={true} initialValue="second" />); 
    
    input = screen.getByTestId('input') as HTMLInputElement; // re-query after rerender
    expect(input.value).toBe('second'); // Behavior depends on how internal state is managed
  });

  it('should allow submitting an empty string if not otherwise validated', async () => {
    // To test "if not otherwise validated" for empty string, pass a validation fn that allows it.
    const mockValidation = vi.fn((value: string) => value === 'disallowed' ? 'Error' : null);
    renderInputDialog({ initialValue: '', validation: mockValidation });
    
    const input = screen.getByTestId('input') as HTMLInputElement;
    expect(input.value).toBe('');
    
    // No validation error should prevent submission

    // Submit button should not be disabled by our permissive validation
    const submitButton = screen.getByRole('button', { name: defaultProps.submitButtonText });
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith('');
    });
  });

  it('should use custom submit button text if provided', () => {
    renderInputDialog({ submitButtonText: 'Confirm Action' });
    expect(screen.getByRole('button', { name: 'Confirm Action' })).toBeInTheDocument();
  });

}); 