'use client';

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TypeFilter } from './TypeFilter'; // Assuming the component is in the same directory for this example
import type { Mock } from 'vitest';

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    FilterIcon: (props: any) => <div data-testid="filter-icon" {...props} />,
    XIcon: (props: any) => <div data-testid="x-icon" {...props} />,
  };
});

// Mock UI components
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: vi.fn(({ children, open, onOpenChange }) => (
    <div data-testid="dropdown-menu" data-open={open} onClick={() => onOpenChange(!open)}>
      {children}
    </div>
  )),
  DropdownMenuTrigger: vi.fn(({ children, asChild }) => (
    <div data-testid="dropdown-trigger">{children}</div>
  )),
  DropdownMenuContent: vi.fn(({ children, className }) => (
    <div data-testid="dropdown-content" className={className}>{children}</div>
  )),
  DropdownMenuRadioGroup: vi.fn(({ children, value, onValueChange }) => (
    <div data-testid="dropdown-radiogroup" data-value={value}>
      {React.Children.map(children, (child: any) => 
        React.cloneElement(child, { onClick: () => onValueChange(child.props.value) })
      )}
    </div>
  )),
  DropdownMenuRadioItem: vi.fn(({ children, value, ...props }) => (
    <div data-testid={`dropdown-radioitem-${value}`} data-value={value} {...props}>
      {children}
    </div>
  )),
}));

vi.mock('@/components/ui/button', () => ({
  Button: vi.fn(({ children, onClick, variant, className, "aria-label": ariaLabel, ...props }) => (
    <button 
      data-testid="button" 
      onClick={onClick} 
      data-variant={variant} 
      className={className} 
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  )),
}));


describe('TypeFilter', () => {
  let mockOnTypeChange: Mock<(type: string | undefined) => void>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnTypeChange = vi.fn();
  });

  const renderTypeFilter = (selectedType: string | undefined) => {
    return render(<TypeFilter selectedType={selectedType} onTypeChange={mockOnTypeChange} />);
  };

  it('should render with default label and no clear button when no type is selected', () => {
    renderTypeFilter(undefined);
    expect(screen.getByTestId('filter-icon')).toBeInTheDocument();
    expect(screen.getByText('Type: Any Type')).toBeInTheDocument();
    expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument();
    
    const triggerButton = screen.getAllByTestId('button')[0];
    expect(triggerButton.className).not.toContain('rounded-r-none');
  });

  it('should render with selected type label and clear button when a type is selected', () => {
    renderTypeFilter('image');
    expect(screen.getByTestId('filter-icon')).toBeInTheDocument();
    expect(screen.getByText('Type: Images')).toBeInTheDocument();
    expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    
    const triggerButton = screen.getAllByTestId('button')[0];
    expect(triggerButton.className).toContain('rounded-r-none');
    expect(triggerButton.className).toContain('border-r-0');
  });

  it('should open dropdown when trigger button is clicked', () => {
    renderTypeFilter(undefined);
    const triggerButton = screen.getAllByTestId('button').find(btn => btn.textContent?.includes('Type:'));
    expect(triggerButton).toBeDefined();

    fireEvent.click(triggerButton!);
    // Our DropdownMenu mock toggles open state via its own onClick tied to onOpenChange
    // So, after click, the data-open attribute should reflect the new state.
    // The actual TypeFilter controls its isOpen state, and passes it to DropdownMenu.
    // Let's verify the component's state via props passed to the mock.
    
    // To properly test this with the current mock, we'd need to see if `onOpenChange` was called
    // which would update the internal `isOpen` state in TypeFilter.
    // For now, let's assume the mock setup for DropdownMenu passes `open` correctly based on TypeFilter's state.
    // A more robust mock would allow checking the `open` prop passed to DropdownMenu.
    
    // Test that the DropdownMenu mock receives open=true after a click sequence.
    // The mock implementation of DropdownMenu calls onOpenChange, which TypeFilter uses to setIsOpen.
    // So, we expect the internal isOpen to become true, and thus the data-open prop to be true.
    expect(screen.getByTestId('dropdown-menu')).toHaveAttribute('data-open', 'true');
    expect(screen.getByTestId('dropdown-content')).toBeInTheDocument(); 
  });

  it('should call onTypeChange with selected value and close dropdown when an item is clicked', () => {
    renderTypeFilter(undefined);
    const triggerButton = screen.getAllByTestId('button').find(btn => btn.textContent?.includes('Type:'));
    fireEvent.click(triggerButton!); // Open dropdown

    const imageOption = screen.getByTestId('dropdown-radioitem-image');
    fireEvent.click(imageOption);

    expect(mockOnTypeChange).toHaveBeenCalledWith('image');
    expect(screen.getByTestId('dropdown-menu')).toHaveAttribute('data-open', 'false');
  });

  it('should call onTypeChange with undefined when "Any Type" is selected', () => {
    renderTypeFilter('image'); // Start with a selection
    const triggerButton = screen.getAllByTestId('button').find(btn => btn.textContent?.includes('Type:'));
    fireEvent.click(triggerButton!); 

    const anyTypeOption = screen.getByTestId('dropdown-radioitem-'); // '' is the value for "Any Type"
    fireEvent.click(anyTypeOption);

    expect(mockOnTypeChange).toHaveBeenCalledWith(undefined);
    expect(screen.getByTestId('dropdown-menu')).toHaveAttribute('data-open', 'false');
  });

  it('should update label when selectedType prop changes', () => {
    const { rerender } = renderTypeFilter(undefined);
    expect(screen.getByText('Type: Any Type')).toBeInTheDocument();

    rerender(<TypeFilter selectedType="video" onTypeChange={mockOnTypeChange} />);
    expect(screen.getByText('Type: Videos')).toBeInTheDocument();
  });

  it('should call onTypeChange with undefined and close dropdown when clear button is clicked', () => {
    renderTypeFilter('document');
    const clearButton = screen.getAllByTestId('button').find(btn => btn.getAttribute('aria-label') === 'Clear type filter');
    expect(clearButton).toBeDefined();
    fireEvent.click(clearButton!); 

    expect(mockOnTypeChange).toHaveBeenCalledWith(undefined);
    // DropdownMenu's onOpenChange should be called with false by TypeFilter
    expect(screen.getByTestId('dropdown-menu')).toHaveAttribute('data-open', 'false');
  });

  it('should hide clear button after filter is cleared', () => {
    const { rerender } = renderTypeFilter('audio');
    expect(screen.getByTestId('x-icon')).toBeInTheDocument();

    // Simulate clearing the filter by changing props
    rerender(<TypeFilter selectedType={undefined} onTypeChange={mockOnTypeChange} />);
    expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument();
    
    const triggerButton = screen.getAllByTestId('button')[0];
    expect(triggerButton.className).not.toContain('rounded-r-none');
  });

   it('should apply correct classes to trigger button based on selection', () => {
    const { rerender } = renderTypeFilter(undefined);
    let triggerButton = screen.getAllByTestId('button').find(btn => btn.textContent?.includes('Type:'))!;
    expect(triggerButton.className).not.toContain('rounded-r-none');
    expect(triggerButton.className).not.toContain('border-r-0');

    rerender(<TypeFilter selectedType="folder" onTypeChange={mockOnTypeChange} />);
    triggerButton = screen.getAllByTestId('button').find(btn => btn.textContent?.includes('Type:'))!;
    expect(triggerButton.className).toContain('rounded-r-none');
    expect(triggerButton.className).toContain('border-r-0');

    rerender(<TypeFilter selectedType={undefined} onTypeChange={mockOnTypeChange} />);
    triggerButton = screen.getAllByTestId('button').find(btn => btn.textContent?.includes('Type:'))!;
    expect(triggerButton.className).not.toContain('rounded-r-none');
    expect(triggerButton.className).not.toContain('border-r-0');
    
    rerender(<TypeFilter selectedType="" onTypeChange={mockOnTypeChange} />); // Empty string is also considered "Any Type"
    triggerButton = screen.getAllByTestId('button').find(btn => btn.textContent?.includes('Type:'))!;
    expect(triggerButton.className).not.toContain('rounded-r-none');
    expect(triggerButton.className).not.toContain('border-r-0');
  });

}); 