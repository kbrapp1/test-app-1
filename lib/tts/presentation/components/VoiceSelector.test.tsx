import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, Mock, MockedFunction } from 'vitest';
import { VoiceSelector } from './VoiceSelector';
import { getTtsVoices } from '../actions/tts';
import { type TtsVoice } from '../../domain';
import { useForm, FormProvider } from 'react-hook-form';

// Mock the getTtsVoices server action
vi.mock('../actions/tts', () => ({
  getTtsVoices: vi.fn(),
}));

// Cast the mock to the correct type
const mockGetTtsVoices = getTtsVoices as Mock;

// Mocks for Lucide icons
vi.mock('lucide-react', () => ({
  Check: () => <svg data-testid="check-icon" />,
  ChevronsUpDown: () => <svg data-testid="chevrons-icon" />,
}));

// Mocks for ShadCN UI components
vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div data-testid="popover">{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => (
    <div data-testid="popover-trigger">{children}</div>
  ),
  PopoverContent: ({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
    <div data-testid="popover-content" className={className} style={style}>{children}</div>
  ),
}));

vi.mock('@/components/ui/command', () => ({
  Command: ({ children, className }: { children: React.ReactNode; className?: string }) => <div data-testid="command" className={className}>{children}</div>,
  CommandInput: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input data-testid="command-input" {...props} />,
  CommandEmpty: ({ children }: { children: React.ReactNode }) => <div data-testid="command-empty">{children}</div>,
  CommandGroup: ({ children, heading }: { children: React.ReactNode; heading?: string }) => (
    <div data-testid="command-group">
      {heading && <div data-testid="command-group-heading">{heading}</div>}
      {children}
    </div>
  ),
  CommandItem: ({ children, onSelect, value }: { children: React.ReactNode; onSelect: () => void; value: string }) => (
    <div data-testid="command-item" data-value={value} onClick={onSelect}>{children}</div>
  ),
  CommandList: ({ children }: { children: React.ReactNode }) => <div data-testid="command-list">{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, role, 'aria-expanded': ariaExpanded, className }: { children: React.ReactNode, variant?: string, role?: string, 'aria-expanded'?: boolean, className?: string }) => (
    <button
      data-testid="button"
      data-variant={variant}
      data-role={role}
      aria-expanded={ariaExpanded}
      className={className}
    >
      {children}
    </button>
  ),
}));

const mockVoices: TtsVoice[] = [
  { id: 'voice1', name: 'Alice', gender: 'Female', accent: 'American' },
  { id: 'voice2', name: 'Bob', gender: 'Male', accent: 'British' },
  { id: 'voice3', name: 'Charlie', gender: 'Female', accent: 'Other' },
];

const mockField = {
  value: 'voice1',
  onChange: vi.fn(),
  onBlur: vi.fn(),
  name: 'voiceId' as const,
  ref: () => {},
};

const mockSetValue = vi.fn() as MockedFunction<(name: string, value: string) => void>;

// Helper to reset mocks before each test
const resetMocks = () => {
  mockGetTtsVoices.mockReset();
  mockField.onChange.mockClear();
  mockSetValue.mockClear();
};

describe('VoiceSelector', () => {
  beforeEach(() => {
    resetMocks();
    mockGetTtsVoices.mockResolvedValue({ success: true, voices: mockVoices, error: null });
  });

  // Helper function to render the component with FormProvider
  const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    const methods = useForm();
    return <FormProvider {...methods}>{children}</FormProvider>;
  };

  const renderComponent = (fieldOverrides = {}, formSetValueParam?: MockedFunction<(name: string, value: string) => void>, provider?: string) => {
    const mergedField = { ...mockField, ...fieldOverrides };
    return render(
      <TestWrapper>
        <VoiceSelector
          field={mergedField} 
          setValue={formSetValueParam || mockSetValue}
          selectedProvider={provider || "test-provider"}
        />
      </TestWrapper>
    );
  };

  it('renders correctly and loads voices', async () => {
    renderComponent();
    await waitFor(() => expect(mockGetTtsVoices).toHaveBeenCalledWith('test-provider', undefined));
  });

  it('displays "Select voice..." when no voice is selected', async () => {
    renderComponent({ value: undefined });
    await waitFor(() => expect(mockGetTtsVoices).toHaveBeenCalledWith('test-provider', undefined));
    expect(screen.getByTestId('popover-trigger')).toHaveTextContent('Select a voice');
  });

  it('displays the selected voice name', async () => {
    renderComponent({ value: 'voice1' });
    await waitFor(() => expect(mockGetTtsVoices).toHaveBeenCalledWith('test-provider', undefined));
    await waitFor(() => {
      expect(screen.getByTestId('popover-trigger')).toHaveTextContent('Alice (Female, American)');
    });
  });

  it('opens popover on trigger click', async () => {
    renderComponent();
    await waitFor(() => expect(mockGetTtsVoices).toHaveBeenCalledWith('test-provider', undefined));

    const trigger = screen.getByTestId('popover-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('popover-content')).toBeVisible();
    });
  });

  it('renders voice items in the popover', async () => {
    renderComponent();
    await waitFor(() => expect(mockGetTtsVoices).toHaveBeenCalledWith('test-provider', undefined));

    fireEvent.click(screen.getByTestId('popover-trigger'));

    await waitFor(() => {
      expect(screen.getByTestId('popover-content')).toBeVisible();
      const items = screen.getAllByTestId('command-item');
      expect(items).toHaveLength(mockVoices.length);
      // Now voices display as "Name (Gender, Accent)" due to VoiceId.forDisplay
      // Sorted by: Female first, then American accent first, then name alphabetically
      expect(items[0]).toHaveTextContent('Alice (Female, American)');
      expect(items[1]).toHaveTextContent('Charlie (Female, Other)');
      expect(items[2]).toHaveTextContent('Bob (Male, British)');
    });
  });

  it('calls setValue when a voice is selected', async () => {
    const localMockSetValue = vi.fn();
    renderComponent({ value: undefined }, localMockSetValue);
    await waitFor(() => expect(mockGetTtsVoices).toHaveBeenCalledWith('test-provider', undefined));

    fireEvent.click(screen.getByTestId('popover-trigger'));
    await waitFor(() => expect(screen.getByTestId('popover-content')).toBeVisible());

    const items = screen.getAllByTestId('command-item');
    const bobItem = items.find(item => item.getAttribute('data-value') === 'voice2');
    expect(bobItem).toBeDefined();
    fireEvent.click(bobItem!);

    await waitFor(() => {
      expect(localMockSetValue).toHaveBeenCalledWith('voiceId', 'voice2', { shouldValidate: true });
    });
  });

  it('filters voices based on search input', async () => {
    renderComponent({value: 'voice1'}); // Ensure a voice is selected initially so the list is populated for filtering
    await waitFor(() => expect(mockGetTtsVoices).toHaveBeenCalledWith('test-provider', undefined));

    fireEvent.click(screen.getByTestId('popover-trigger'));
    await waitFor(() => expect(screen.getByTestId('popover-content')).toBeVisible());

    // const searchInput = screen.getByTestId('command-input'); // Old way
    const searchInput = screen.getByPlaceholderText('Search voice...'); // New way, finding our custom input
    
    fireEvent.change(searchInput, { target: { value: 'Ali' } });
    expect(searchInput).toHaveValue('Ali');

    // Check that only 'Alice' is visible (with full display format)
    const items = screen.getAllByTestId('command-item');
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent('Alice (Female, American)');
    expect(screen.queryByText('Bob (Male, British)')).not.toBeInTheDocument();
    expect(screen.queryByText('Charlie (Female, Other)')).not.toBeInTheDocument();

    // Clear the search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(searchInput).toHaveValue('');
    const allItems = screen.getAllByTestId('command-item');
    expect(allItems).toHaveLength(mockVoices.length); // Should show all voices again
  });

  it('shows loading state initially (simulated by delayed promise)', async () => {
    // Delay the mock response to show loading
    mockGetTtsVoices.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true, voices: mockVoices, error: null }), 100))
    );
    renderComponent();
    // Expect the initial call without waiting for it to resolve for this specific check
    expect(mockGetTtsVoices).toHaveBeenCalledWith('test-provider', undefined);

    fireEvent.click(screen.getByTestId('popover-trigger'));
    
    // Check that items are not yet rendered while mock is resolving
    expect(screen.queryAllByTestId('command-item')).toHaveLength(0);

    await waitFor(() => {
      expect(screen.getAllByTestId('command-item')).toHaveLength(mockVoices.length);
    }, { timeout: 200 }); // Wait for the delayed promise
  });

  it('handles error when fetching voices', async () => {
    mockGetTtsVoices.mockResolvedValueOnce({ success: false, voices: null, error: { message: 'Failed to fetch' } });
    renderComponent();

    await waitFor(() => expect(mockGetTtsVoices).toHaveBeenCalledWith('test-provider', undefined));

    fireEvent.click(screen.getByTestId('popover-trigger'));

    await waitFor(() => {
      expect(screen.getByTestId('command-empty')).toBeVisible();
      expect(screen.getByTestId('command-empty')).toHaveTextContent('Failed to fetch');
    });
  });

  it('displays "Select voice..." in trigger if selected voice is not in the loaded list', async () => {
    renderComponent({ value: 'unknownVoiceId' });

    await waitFor(() => expect(mockGetTtsVoices).toHaveBeenCalledWith('test-provider', undefined));

    expect(screen.getByTestId('popover-trigger')).toHaveTextContent('Select a voice');
  });

  it('displays correct voice in trigger if current value is initially null/undefined then a voice is selected', async () => {
    const localMockSetValue = vi.fn();
    renderComponent({ value: undefined }, localMockSetValue);
  
    await waitFor(() => expect(mockGetTtsVoices).toHaveBeenCalledWith('test-provider', undefined));
    expect(screen.getByTestId('popover-trigger')).toHaveTextContent('Select a voice');
  
    fireEvent.click(screen.getByTestId('popover-trigger'));
    
    // Wait for the popover content to be visible and voices to load
    await waitFor(() => {
      expect(screen.getByTestId('popover-content')).toBeVisible();
    });
    
    // Wait for the command items to be rendered
    await waitFor(() => {
      expect(screen.getAllByTestId('command-item')).toHaveLength(mockVoices.length);
    });
    
    const items = screen.getAllByTestId('command-item');
    const bobItem = items.find(item => item.getAttribute('data-value') === 'voice2');
    expect(bobItem).toBeDefined();
    fireEvent.click(bobItem!);
  
    await waitFor(() => {
      expect(localMockSetValue).toHaveBeenCalledWith('voiceId', 'voice2', { shouldValidate: true });
    });
  });

}); 