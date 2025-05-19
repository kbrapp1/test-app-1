'use client';

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SizeFilter, SIZE_OPTIONS } from './SizeFilter'; // Adjust path as needed

// Import the components we are going to mock for typed mocking
import { SizeFilterListView as OriginalSizeFilterListView } from './SizeFilterListView';
import { SizeFilterCustomView as OriginalSizeFilterCustomView } from './SizeFilterCustomView';

const CUSTOM_SIZE_VALUE = 'custom';
const MB_IN_BYTES = 1024 * 1024;

// --- Mocks ---
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    ArchiveIcon: (props: any) => <div data-testid="archive-icon" {...props} />,
    XIcon: (props: any) => <div data-testid="x-icon" {...props} />,
  };
});

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: vi.fn(({ children, open, onOpenChange }) => (
    <div data-testid="dropdown-menu" data-open={open} onClick={() => onOpenChange(!open)}>
      {children}
    </div>
  )),
  DropdownMenuTrigger: vi.fn(({ children }) => <div data-testid="dropdown-trigger">{children}</div>),
  DropdownMenuContent: vi.fn(({ children, className, align }) => (
    <div data-testid="dropdown-content" className={className} data-align={align}>{children}</div>
  )),
}));

vi.mock('@/components/ui/button', () => ({
  Button: vi.fn(({ children, onClick, variant, className, 'aria-label': ariaLabel, ...rest }) => (
    <button 
      data-testid={ariaLabel === 'Clear size filter' ? 'clear-x-button' : 'button'} 
      onClick={onClick} 
      data-variant={variant} 
      className={className}
      aria-label={ariaLabel}
      {...rest}
    >
      {children}
    </button>
  )),
}));

// vi.mock will replace the actual components with these vi.fn() instances
vi.mock('./SizeFilterListView', () => ({
  SizeFilterListView: vi.fn(),
}));

vi.mock('./SizeFilterCustomView', () => ({
  SizeFilterCustomView: vi.fn(),
}));

// --- Test Suite ---
describe('SizeFilter', () => {
  let mockOnOptionChange: ReturnType<typeof vi.fn<(option: string | undefined, min?: number, max?: number) => void>>;

  // Get the mocked versions of the components for use in beforeEach
  const MockedSizeFilterListView = vi.mocked(OriginalSizeFilterListView, true);
  const MockedSizeFilterCustomView = vi.mocked(OriginalSizeFilterCustomView, true);

  const renderSizeFilter = (props: Partial<Parameters<typeof SizeFilter>[0]> = {}) => {
    const defaultProps: Parameters<typeof SizeFilter>[0] = {
      selectedOption: undefined,
      onOptionChange: mockOnOptionChange,
      selectedMinSize: undefined,
      selectedMaxSize: undefined,
    };
    return render(<SizeFilter {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    vi.useFakeTimers();
    mockOnOptionChange = vi.fn();

    MockedSizeFilterListView.mockImplementation(({ onPredefinedOptionSelect, onNavigateToCustom, selectedOption: currentListSelected }) => (
      <div data-testid="size-filter-list-view">
        <button data-testid="list-select-any" onClick={() => onPredefinedOptionSelect('')}>Any Size</button>
        <button data-testid="list-select-small" onClick={() => onPredefinedOptionSelect('small')}>Small</button>
        <button data-testid="list-navigate-custom" onClick={onNavigateToCustom}>Custom</button>
        <span data-testid="list-selected-option">{currentListSelected}</span>
      </div>
    ));
    MockedSizeFilterCustomView.mockImplementation(({ 
      tempMinSizeMB, tempMaxSizeMB, 
      onTempMinChange, onTempMaxChange, 
      onApplyCustomSize, onClearCustom, onBackToList 
    }) => (
      <div data-testid="size-filter-custom-view">
        <input data-testid="custom-min-input" value={tempMinSizeMB} onChange={(e) => onTempMinChange(e.target.value)} />
        <input data-testid="custom-max-input" value={tempMaxSizeMB} onChange={(e) => onTempMaxChange(e.target.value)} />
        <button data-testid="custom-apply" onClick={onApplyCustomSize}>Apply</button>
        <button data-testid="custom-clear" onClick={onClearCustom}>Clear</button>
        <button data-testid="custom-back" onClick={onBackToList}>Back</button>
      </div>
    ));
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
    MockedSizeFilterListView.mockReset();
    MockedSizeFilterCustomView.mockReset();
  });

  // --- Initial Rendering and Button Label Tests ---
  it('should render trigger button with default label "Any Size"', () => {
    renderSizeFilter();
    expect(screen.getByTestId('button')).toHaveTextContent('Size: Any Size');
    expect(screen.queryByTestId('clear-x-button')).not.toBeInTheDocument();
  });

  it.each([
    { option: 'small', expectedLabel: 'Size: < 1MB' },
    { option: 'medium', expectedLabel: 'Size: 1MB - 10MB' },
    { option: '', expectedLabel: 'Size: Any Size' }, 
    { option: undefined, expectedLabel: 'Size: Any Size' }, 
  ])('should display correct label for predefined option $option', ({ option, expectedLabel }) => {
    renderSizeFilter({ selectedOption: option });
    expect(screen.getByTestId('button')).toHaveTextContent(expectedLabel);
  });

  it.each([
    { min: (1 * MB_IN_BYTES).toString(), max: (10 * MB_IN_BYTES).toString(), expected: '1MB - 10MB' }, 
    { min: (1 * MB_IN_BYTES).toString(), max: undefined, expected: '> 1MB' }, 
    { min: undefined, max: (10 * MB_IN_BYTES).toString(), expected: '< 10MB' }, 
    { min: (1.5 * MB_IN_BYTES).toString(), max: (10.75 * MB_IN_BYTES).toString(), expected: '1.5MB - 10.75MB' },
    { min: (2 * MB_IN_BYTES).toString(), max: (2.00 * MB_IN_BYTES).toString(), expected: '2MB - 2MB' }, // tests trailing .00
    { min: (2.50 * MB_IN_BYTES).toString(), max: (3.5 * MB_IN_BYTES).toString(), expected: '2.5MB - 3.5MB' }, // tests trailing .x0
    { min: undefined, max: undefined, expected: 'Custom Size' }, 
  ])('should display correct label for custom sizes (min: $min, max: $max)', ({ min, max, expected }) => {
    renderSizeFilter({ selectedOption: CUSTOM_SIZE_VALUE, selectedMinSize: min, selectedMaxSize: max });
    expect(screen.getByTestId('button')).toHaveTextContent(`Size: ${expected}`);
  });

  it('should show X clear button if a filter is active', () => {
    renderSizeFilter({ selectedOption: 'small' });
    expect(screen.getByTestId('clear-x-button')).toBeInTheDocument();
  });

  // --- Dropdown and View Switching ---
  it('should open dropdown and show ListView by default', () => {
    renderSizeFilter();
    const triggerButton = screen.getByTestId('button');
    fireEvent.click(triggerButton); // Open dropdown
    expect(screen.getByTestId('dropdown-menu')).toHaveAttribute('data-open', 'true');
    expect(MockedSizeFilterListView).toHaveBeenCalled();
    expect(screen.getByTestId('size-filter-list-view')).toBeInTheDocument();
    expect(MockedSizeFilterCustomView).not.toHaveBeenCalled();
  });

  it('should switch to CustomView when navigate to custom is called from ListView', () => {
    renderSizeFilter();
    fireEvent.click(screen.getByTestId('button')); // Open dropdown
    fireEvent.click(screen.getByTestId('list-navigate-custom'));
    act(() => { vi.advanceTimersByTime(1); }); // Allow useEffect to run if any state change triggers it.
    expect(MockedSizeFilterCustomView).toHaveBeenCalled();
    expect(screen.getByTestId('size-filter-custom-view')).toBeInTheDocument();
    expect(mockOnOptionChange).toHaveBeenCalledWith(CUSTOM_SIZE_VALUE); 
  });

  it('should switch back to ListView from CustomView', () => {
    renderSizeFilter({ selectedOption: CUSTOM_SIZE_VALUE });
    fireEvent.click(screen.getByTestId('button')); // Open dropdown
    expect(MockedSizeFilterCustomView).toHaveBeenCalled(); // Starts in custom view due to prop
    fireEvent.click(screen.getByTestId('custom-back'));
    act(() => { vi.advanceTimersByTime(1); });
    expect(MockedSizeFilterListView).toHaveBeenCalled();
    expect(screen.getByTestId('size-filter-list-view')).toBeInTheDocument();
  });

  // --- Interactions with ListView ---
  it('selecting a predefined option from ListView calls onOptionChange and closes dropdown', () => {
    renderSizeFilter();
    fireEvent.click(screen.getByTestId('button')); // Open
    fireEvent.click(screen.getByTestId('list-select-small'));
    expect(mockOnOptionChange).toHaveBeenCalledWith('small');
    expect(screen.getByTestId('dropdown-menu')).toHaveAttribute('data-open', 'false');
  });

  // --- Interactions with CustomView ---
  it('applying custom size calls onOptionChange with bytes and closes dropdown', () => {
    renderSizeFilter({ selectedOption: CUSTOM_SIZE_VALUE });
    fireEvent.click(screen.getByTestId('button')); // Open

    // Simulate user typing into custom inputs (via mock CustomView)
    fireEvent.change(screen.getByTestId('custom-min-input'), { target: { value: '2' } }); // 2MB
    fireEvent.change(screen.getByTestId('custom-max-input'), { target: { value: '20' } }); // 20MB
    
    fireEvent.click(screen.getByTestId('custom-apply'));
    expect(mockOnOptionChange).toHaveBeenCalledWith(CUSTOM_SIZE_VALUE, 2 * MB_IN_BYTES, 20 * MB_IN_BYTES);
    expect(screen.getByTestId('dropdown-menu')).toHaveAttribute('data-open', 'false');
  });

  it('clearing custom size from CustomView calls onOptionChange(undefined) and switches to ListView', () => {
    renderSizeFilter({ selectedOption: CUSTOM_SIZE_VALUE });
    fireEvent.click(screen.getByTestId('button')); // Open
    fireEvent.click(screen.getByTestId('custom-clear'));
    expect(mockOnOptionChange).toHaveBeenCalledWith(undefined);
    act(() => { vi.advanceTimersByTime(1); });
    expect(MockedSizeFilterListView).toHaveBeenCalled();
    expect(screen.getByTestId('size-filter-list-view')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-menu')).toHaveAttribute('data-open', 'false');
  });
  
  // --- Clear X Button ---
  it('clicking X clear button calls onOptionChange(undefined) and updates UI', () => {
    const { rerender } = renderSizeFilter({ selectedOption: 'small' });
    const clearButton = screen.getByTestId('clear-x-button');
    fireEvent.click(clearButton);
    expect(mockOnOptionChange).toHaveBeenCalledWith(undefined);
    
    // Rerender with cleared props to simulate parent component update
    rerender(<SizeFilter selectedOption={undefined} onOptionChange={mockOnOptionChange} />); 
    expect(screen.getByTestId('button')).toHaveTextContent('Size: Any Size');
    expect(screen.queryByTestId('clear-x-button')).not.toBeInTheDocument();
  });

  // --- useEffect behavior for initializing custom view values ---
  it('useEffect initializes temp sizes when selectedOption is CUSTOM_SIZE_VALUE', () => {
    renderSizeFilter({ 
      selectedOption: CUSTOM_SIZE_VALUE, 
      selectedMinSize: (3 * MB_IN_BYTES).toString(), 
      selectedMaxSize: (30 * MB_IN_BYTES).toString() 
    });
    fireEvent.click(screen.getByTestId('button')); // Open dropdown to make CustomView render
    expect(screen.getByTestId('custom-min-input')).toHaveValue('3');
    expect(screen.getByTestId('custom-max-input')).toHaveValue('30');
  });

  it('handleBackToList from custom view calls onOptionChange(undefined) if no values were set', () => {
    renderSizeFilter({ selectedOption: CUSTOM_SIZE_VALUE, selectedMinSize: undefined, selectedMaxSize: undefined });
    fireEvent.click(screen.getByTestId('button')); // Open dropdown
    // Ensure temp values are also empty (default state in custom view mock)
    fireEvent.change(screen.getByTestId('custom-min-input'), { target: { value: '' } });
    fireEvent.change(screen.getByTestId('custom-max-input'), { target: { value: '' } });

    fireEvent.click(screen.getByTestId('custom-back'));
    expect(mockOnOptionChange).toHaveBeenCalledWith(undefined);
  });

  it('handleBackToList from custom view does NOT call onOptionChange if values were set previously', () => {
    renderSizeFilter({ selectedOption: CUSTOM_SIZE_VALUE, selectedMinSize: (1*MB_IN_BYTES).toString(), selectedMaxSize: undefined });
    fireEvent.click(screen.getByTestId('button')); // Open dropdown
    // temp values might be different or same, the important part is selectedMin/MaxSize exist

    fireEvent.click(screen.getByTestId('custom-back'));
    // Only one call is expected from the initial onNavigateToCustom if selectedOption was not CUSTOM_SIZE_VALUE.
    // If it was already CUSTOM_SIZE_VALUE, then onOptionChange is not called on navigate.
    // Here we check it wasn't called with 'undefined'.
    const callsWithUndefined = mockOnOptionChange.mock.calls.filter(call => call[0] === undefined);
    expect(callsWithUndefined.length).toBe(0);
  });
}); 