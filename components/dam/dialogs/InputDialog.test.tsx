import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InputDialog, InputDialogProps } from './InputDialog'; // Adjust path as necessary
import { vi } from 'vitest'; // Import vi for Vitest mocking

// Mock a simple toast if your dialog or its onSubmit handler uses it
// vi.mock('@/components/ui/use-toast', () => ({
//   useToast: () => ({ toast: vi.fn() }),
// }));

const mockOnOpenChange = vi.fn();
const mockOnSubmit = vi.fn();

const defaultProps: InputDialogProps = {
  isOpen: true,
  onOpenChange: mockOnOpenChange,
  title: 'Test Input Dialog',
  description: '',
  initialValue: 'Initial Text',
  onSubmit: mockOnSubmit,
};

const TestWrapper: React.FC<Partial<InputDialogProps>> = (props) => {
  return <InputDialog {...defaultProps} {...props} />;
};

describe('InputDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Use vi.clearAllMocks() for Vitest
  });

  it('renders correctly with initial props', () => {
    render(<TestWrapper />);
    expect(screen.getByText('Test Input Dialog')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Initial Text')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('updates input value on change', async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);
    const input = screen.getByDisplayValue('Initial Text') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'New Value');
    expect(input.value).toBe('New Value');
  });

  it('calls onSubmit with the new value when form is submitted', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValueOnce(undefined); // Ensure onSubmit is an async mock if it returns a Promise
    render(<TestWrapper />);
    const input = screen.getByDisplayValue('Initial Text');
    await user.clear(input);
    await user.type(input, 'Submitted Value');
    await user.click(screen.getByRole('button', { name: /Save/i }));

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith('Submitted Value');
  });

  it('does not call onSubmit if input is empty (default behavior)', async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);
    const input = screen.getByDisplayValue('Initial Text');
    await user.clear(input);
    await user.click(screen.getByRole('button', { name: /Save/i }));

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText('Input cannot be empty.')).toBeInTheDocument();
  });

  it('calls onOpenChange(false) when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);
    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('displays description if provided', () => {
    render(<TestWrapper description="This is a test description." />);
    expect(screen.getByText('This is a test description.')).toBeInTheDocument();
  });

  it('uses custom button text if provided', () => {
    render(<TestWrapper submitButtonText="Confirm" cancelButtonText="Dismiss" />);
    expect(screen.getByRole('button', { name: /Confirm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dismiss/i })).toBeInTheDocument();
  });

  it('displays loading state when isLoading prop is true', () => {
    render(<TestWrapper isLoading={true} />);
    expect(screen.getByRole('button', { name: /Processing.../i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Processing.../i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();
  });

  describe('With Validation Prop', () => {
    const mockValidation = vi.fn();
    
    it('calls validation function on input change', async () => {
      const user = userEvent.setup();
      mockValidation.mockReturnValue(null); // No error initially
      render(<TestWrapper validation={mockValidation} />); 
      const input = screen.getByDisplayValue('Initial Text');
      await user.type(input, 'a'); // Type one character
      expect(mockValidation).toHaveBeenCalledWith('Initial Texta');
    });

    it('displays validation error and prevents submission if validation fails', async () => {
      const user = userEvent.setup();
      const errorMessage = "Invalid input!";
      mockValidation.mockReturnValue(errorMessage);
      render(<TestWrapper validation={mockValidation} initialValue="test"/>);
      
      const input = screen.getByDisplayValue('test') as HTMLInputElement;
      // Trigger validation by typing, even if value is same as initial (or make it different)
      await user.type(input, ' '); // Add a space to trigger change and validation
      await user.keyboard('[Backspace]'); // Remove the space
      
      expect(await screen.findByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Save/i })).toBeDisabled();
      
      await user.click(screen.getByRole('button', { name: /Save/i }));
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('clears validation error and allows submission if input becomes valid', async () => {
      const user = userEvent.setup();
      
      mockValidation.mockImplementation((value: string) => {
        if (value === 'invalid') {
          return 'Initial error';
        }
        if (value === 'valid_input') {
          return null; // Valid
        }
        // For other intermediate states during typing, we can assume no error or specific errors.
        // For this test, we'll default to null for simplicity for states not explicitly "invalid".
        return null; 
      });
      
      render(<TestWrapper validation={mockValidation} initialValue="something_else" />);
      // It's generally safer to get by role or placeholder if initialValue changes or input is cleared
      const input = screen.getByRole('textbox') as HTMLInputElement; 
      // Or, if you rely on initialValue for selection:
      // const input = screen.getByDisplayValue('something_else') as HTMLInputElement;


      // Phase 1: Make input invalid
      await user.clear(input); // Clear "something_else"
      await user.type(input, 'invalid'); // Type "invalid"
      
      expect(await screen.findByText('Initial error')).toBeInTheDocument();
      // Check that validation was indeed called with "invalid"
      // userEvent.type calls the handler for each char, so "invalid" will be the last relevant one.
      expect(mockValidation).toHaveBeenCalledWith('invalid');
      expect(screen.getByRole('button', { name: /Save/i })).toBeDisabled();

      // Phase 2: Make input valid
      await user.clear(input); // Clear "invalid"
      await user.type(input, 'valid_input'); // Type "valid_input"
      
      // Wait for the error message to disappear
      await waitFor(() => {
        expect(screen.queryByText('Initial error')).not.toBeInTheDocument();
      });
      expect(mockValidation).toHaveBeenCalledWith('valid_input');
      expect(screen.getByRole('button', { name: /Save/i })).not.toBeDisabled();

      // Phase 3: Submit
      mockOnSubmit.mockResolvedValueOnce(undefined); // Ensure mock is ready for this specific call
      await user.click(screen.getByRole('button', { name: /Save/i }));
      expect(mockOnSubmit).toHaveBeenCalledWith('valid_input');
    });

    it('allows submission with empty string if validation explicitly allows it', async () => {
        const user = userEvent.setup();
        // Validation returns null (no error) for empty string
        mockValidation.mockImplementation((value: string) => value.trim() === '' ? null : 'Must be empty');
        render(<TestWrapper validation={mockValidation} initialValue="not empty"/>);
        const input = screen.getByDisplayValue('not empty');
        await user.clear(input);

        expect(screen.queryByText('Must be empty')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Save/i })).not.toBeDisabled();

        await user.click(screen.getByRole('button', { name: /Save/i }));
        expect(mockOnSubmit).toHaveBeenCalledWith('');
    });
  });
}); 