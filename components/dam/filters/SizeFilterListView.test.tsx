'use client';

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SizeFilterListView } from './SizeFilterListView';

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    ChevronLeftIcon: (props: any) => <div data-testid="chevron-left-icon" {...props} />,
  };
});

let latestPreventDefaultSpy = vi.fn<() => void>(); // Use () => void for functions with no args returning void

vi.mock('@/components/ui/dropdown-menu', () => {
  let MockedDropdownMenuRadioItemLocal: any;

  const MockedDropdownMenuRadioGroupLocal = vi.fn(({ children, value, onValueChange, className }) => (
    <div data-testid="dropdown-radio-group" data-value={value} className={className}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === MockedDropdownMenuRadioItemLocal) {
          return React.cloneElement(child as React.ReactElement<any>, { __onGroupValueChange__: onValueChange });
        }
        return child;
      })}
    </div>
  ));

  MockedDropdownMenuRadioItemLocal = vi.fn(({ children, value, className, __onGroupValueChange__ }) => (
    <div 
      data-testid="dropdown-radio-item" 
      data-value={value} 
      className={className} 
      onClick={() => __onGroupValueChange__?.(value)}
    >
      {/* We don't need a real radio input for the mock's logic, text content is enough for getByText */}
      {children}
    </div>
  ));

  const MockedDropdownMenuItemLocal = vi.fn(({ children, onSelect, className }) => {
    const handleClick = () => {
      const mockEvent = { preventDefault: vi.fn<() => void>() }; // Use () => void here too
      latestPreventDefaultSpy = mockEvent.preventDefault; 
      if (onSelect) {
        onSelect(mockEvent as unknown as Event);
      }
    };
    return (
      <div data-testid="dropdown-menu-item" onClick={handleClick} className={className}>
        {children}
      </div>
    );
  });

  return {
    DropdownMenuRadioGroup: MockedDropdownMenuRadioGroupLocal,
    DropdownMenuRadioItem: MockedDropdownMenuRadioItemLocal,
    DropdownMenuSeparator: vi.fn(({ className }) => <hr data-testid="dropdown-separator" className={className} />),
    DropdownMenuItem: MockedDropdownMenuItemLocal,
  };
});

const mockSizeOptions = [
  { value: 'all', label: 'All sizes' },
  { value: 'small', label: 'Small (<1MB)' },
  { value: 'medium', label: 'Medium (1MB-10MB)' },
  { value: 'large', label: 'Large (>10MB)' },
];

describe('SizeFilterListView', () => {
  let mockOnPredefinedOptionSelect: ReturnType<typeof vi.fn<(value: string) => void>>;
  let mockOnNavigateToCustom: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnPredefinedOptionSelect = vi.fn();
    mockOnNavigateToCustom = vi.fn();
    latestPreventDefaultSpy.mockClear(); // Clear the module-scoped spy
  });

  const renderComponent = (selectedOption?: string) => {
    render(
      <SizeFilterListView
        selectedOption={selectedOption}
        sizeOptions={mockSizeOptions as any} 
        onPredefinedOptionSelect={mockOnPredefinedOptionSelect}
        onNavigateToCustom={mockOnNavigateToCustom}
      />
    );
  };

  it('should render all size options and the custom range item', () => {
    renderComponent();
    mockSizeOptions.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
    expect(screen.getByText('Custom range...')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-separator')).toBeInTheDocument();
  });

  it('should pass the selectedOption to DropdownMenuRadioGroup', () => {
    renderComponent('small');
    const radioGroup = screen.getByTestId('dropdown-radio-group');
    expect(radioGroup).toHaveAttribute('data-value', 'small');
  });

  it('should pass an empty string to DropdownMenuRadioGroup if selectedOption is undefined', () => {
    renderComponent(undefined);
    const radioGroup = screen.getByTestId('dropdown-radio-group');
    expect(radioGroup).toHaveAttribute('data-value', '');
  });

  it('should call onPredefinedOptionSelect when a radio item is clicked', () => {
    renderComponent('all'); // Initial selection, doesn't really matter for this test
    const smallOptionLabel = screen.getByText('Small (<1MB)');
    // The clickable element is the div with data-testid="dropdown-radio-item" which contains the label
    const smallOptionItem = smallOptionLabel.closest('[data-testid="dropdown-radio-item"]');
    
    expect(smallOptionItem).toBeInTheDocument();
    if (smallOptionItem) {
      fireEvent.click(smallOptionItem);
    }
    expect(mockOnPredefinedOptionSelect).toHaveBeenCalledWith('small');
  });

  it('should call onNavigateToCustom and event.preventDefault when custom range item is clicked', () => {
    renderComponent();
    const customRangeItem = screen.getByText('Custom range...').closest('[data-testid="dropdown-menu-item"]');
    
    expect(customRangeItem).toBeInTheDocument();
    if (customRangeItem) {
        fireEvent.click(customRangeItem);
    }

    expect(mockOnNavigateToCustom).toHaveBeenCalledTimes(1);
    expect(latestPreventDefaultSpy).toHaveBeenCalledTimes(1); // Use the module-scoped spy
  });

  it('should render correct classNames passed from component', () => {
    renderComponent();
    expect(screen.getByTestId('dropdown-radio-group')).toHaveClass('p-1');
    const radioItems = screen.getAllByTestId('dropdown-radio-item');
    // Check one item to ensure class is applied, assuming map applies to all
    expect(radioItems[0]).toHaveClass('text-sm'); 
    expect(screen.getByTestId('dropdown-separator')).toHaveClass('my-1');
    expect(screen.getByText('Custom range...').closest('[data-testid="dropdown-menu-item"]')).toHaveClass('text-sm justify-between cursor-pointer');
  });

}); 