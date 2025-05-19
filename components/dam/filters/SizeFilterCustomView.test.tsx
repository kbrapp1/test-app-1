'use client';

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SizeFilterCustomView } from './SizeFilterCustomView';

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    ChevronLeftIcon: (props: any) => <div data-testid="chevron-left-icon" {...props} />,
  };
});

// Mock UI components
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenuLabel: vi.fn(({ children, className }) => <div data-testid="dropdown-label" className={className}>{children}</div>),
  DropdownMenuSeparator: vi.fn(({ className }) => <hr data-testid="dropdown-separator" className={className} />),
}));

vi.mock('@/components/ui/button', () => ({
  Button: vi.fn(({ children, onClick, variant, size, className }) => (
    <button 
      data-testid="button" 
      onClick={onClick} 
      data-variant={variant} 
      data-size={size} 
      className={className}
    >
      {children}
    </button>
  )),
}));

vi.mock('@/components/ui/input', () => ({
  Input: vi.fn(({ type, placeholder, value, onChange, className }) => (
    <input 
      data-testid="input" 
      type={type} 
      placeholder={placeholder} 
      value={value} 
      onChange={onChange} 
      className={className} 
    />
  )),
}));

describe('SizeFilterCustomView', () => {
  let mockOnTempMinChange: ReturnType<typeof vi.fn<(value: string) => void>>;
  let mockOnTempMaxChange: ReturnType<typeof vi.fn<(value: string) => void>>;
  let mockOnApplyCustomSize: ReturnType<typeof vi.fn<() => void>>;
  let mockOnClearCustom: ReturnType<typeof vi.fn<() => void>>;
  let mockOnBackToList: ReturnType<typeof vi.fn<() => void>>;

  const initialProps = {
    tempMinSizeMB: '5',
    tempMaxSizeMB: '50',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnTempMinChange = vi.fn();
    mockOnTempMaxChange = vi.fn();
    mockOnApplyCustomSize = vi.fn();
    mockOnClearCustom = vi.fn();
    mockOnBackToList = vi.fn();
  });

  const renderComponent = (props: Partial<typeof initialProps> = {}) => {
    const fullProps = { ...initialProps, ...props };
    render(
      <SizeFilterCustomView
        tempMinSizeMB={fullProps.tempMinSizeMB}
        tempMaxSizeMB={fullProps.tempMaxSizeMB}
        onTempMinChange={mockOnTempMinChange}
        onTempMaxChange={mockOnTempMaxChange}
        onApplyCustomSize={mockOnApplyCustomSize}
        onClearCustom={mockOnClearCustom}
        onBackToList={mockOnBackToList}
      />
    );
  };

  it('should render all elements with initial values and placeholders', () => {
    renderComponent();

    // Back button
    expect(screen.getByText('Back').closest('button')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-left-icon')).toBeInTheDocument();

    // Labels
    expect(screen.getByText('Min size (MB)')).toBeInTheDocument();
    expect(screen.getByText('Max size (MB)')).toBeInTheDocument();

    // Inputs
    const inputs = screen.getAllByTestId('input');
    expect(inputs[0]).toHaveValue(Number(initialProps.tempMinSizeMB));
    expect(inputs[0]).toHaveAttribute('placeholder', 'e.g., 5');
    expect(inputs[0]).toHaveAttribute('type', 'number');

    expect(inputs[1]).toHaveValue(Number(initialProps.tempMaxSizeMB));
    expect(inputs[1]).toHaveAttribute('placeholder', 'e.g., 50');
    expect(inputs[1]).toHaveAttribute('type', 'number');

    // Separator
    expect(screen.getByTestId('dropdown-separator')).toBeInTheDocument();

    // Action Buttons
    expect(screen.getByText('Clear').closest('button')).toBeInTheDocument();
    expect(screen.getByText('Apply').closest('button')).toBeInTheDocument();
  });

  it('should call onTempMinChange when min size input changes', () => {
    renderComponent();
    const minInput = screen.getAllByTestId('input')[0];
    fireEvent.change(minInput, { target: { value: '10' } });
    expect(mockOnTempMinChange).toHaveBeenCalledWith('10');
  });

  it('should call onTempMaxChange when max size input changes', () => {
    renderComponent();
    const maxInput = screen.getAllByTestId('input')[1];
    fireEvent.change(maxInput, { target: { value: '100' } });
    expect(mockOnTempMaxChange).toHaveBeenCalledWith('100');
  });

  it('should call onBackToList when Back button is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Back').closest('button')!);
    expect(mockOnBackToList).toHaveBeenCalledTimes(1);
  });

  it('should call onClearCustom when Clear button is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Clear').closest('button')!);
    expect(mockOnClearCustom).toHaveBeenCalledTimes(1);
  });

  it('should call onApplyCustomSize when Apply button is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Apply').closest('button')!);
    expect(mockOnApplyCustomSize).toHaveBeenCalledTimes(1);
  });

  it('should apply correct classNames and attributes for styling', () => {
    renderComponent();
    // Back Button
    const backButton = screen.getByText('Back').closest('button');
    expect(backButton).toHaveClass('mb-2 w-full justify-start text-sm h-8');
    expect(backButton).toHaveAttribute('data-variant', 'ghost');
    expect(backButton).toHaveAttribute('data-size', 'sm');
    expect(screen.getByTestId('chevron-left-icon')).toHaveClass('h-4 w-4 mr-1');

    // Labels
    const labels = screen.getAllByTestId('dropdown-label');
    expect(labels[0]).toHaveClass('px-1 text-xs font-normal text-muted-foreground');
    expect(labels[1]).toHaveClass('px-1 text-xs font-normal text-muted-foreground');

    // Inputs
    const inputs = screen.getAllByTestId('input');
    expect(inputs[0]).toHaveClass('h-9 mb-2 text-sm');
    expect(inputs[1]).toHaveClass('h-9 mb-2 text-sm');

    // Separator
    expect(screen.getByTestId('dropdown-separator')).toHaveClass('my-2');

    // Clear Button
    const clearButton = screen.getByText('Clear').closest('button');
    expect(clearButton).toHaveClass('text-sm h-8');
    expect(clearButton).toHaveAttribute('data-variant', 'ghost');
    expect(clearButton).toHaveAttribute('data-size', 'sm');

    // Apply Button
    const applyButton = screen.getByText('Apply').closest('button');
    expect(applyButton).toHaveClass('text-sm h-8');
    expect(applyButton).toHaveAttribute('data-size', 'sm');
  });
}); 