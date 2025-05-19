'use client';

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SortControl } from './SortControl';
import type { Mock } from 'vitest';

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  // Define mockIcons inside the factory to avoid hoisting issues
  const mockIconsList = {
    ChevronsUpDown: (props: any) => <div data-testid="chevrons-up-down-icon" {...props} />,
    ArrowDownAZ: (props: any) => <div data-testid="arrow-down-az-icon" {...props} />,
    ArrowUpAZ: (props: any) => <div data-testid="arrow-up-az-icon" {...props} />,
    ArrowDownWideNarrow: (props: any) => <div data-testid="arrow-down-wide-narrow-icon" {...props} />,
    ArrowUpWideNarrow: (props: any) => <div data-testid="arrow-up-wide-narrow-icon" {...props} />,
    FileText: (props: any) => <div data-testid="file-text-icon" {...props} />,
    CalendarClock: (props: any) => <div data-testid="calendar-clock-icon" {...props} />,
  };
  return {
    ...actual,
    ...mockIconsList, // Use the locally defined list
  };
});

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: vi.fn(({ children, onClick, variant, className, ...props }) => (
    <button data-testid="button" onClick={onClick} data-variant={variant} className={className} {...props}>
      {children}
    </button>
  )),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: vi.fn(({ children }) => <div data-testid="dropdown-menu">{children}</div>),
  DropdownMenuTrigger: vi.fn(({ children }) => <div data-testid="dropdown-trigger">{children}</div>),
  DropdownMenuContent: vi.fn(({ children, className }) => <div data-testid="dropdown-content" className={className}>{children}</div>),
  DropdownMenuGroup: vi.fn(({ children }) => <div data-testid="dropdown-group">{children}</div>),
  DropdownMenuItem: vi.fn(({ children, onClick, className }) => (
    <div data-testid="dropdown-item" onClick={onClick} className={className}>{children}</div>
  )),
  DropdownMenuLabel: vi.fn(({ children }) => <div data-testid="dropdown-label">{children}</div>),
  DropdownMenuSeparator: vi.fn(() => <hr data-testid="dropdown-separator" />),
}));

describe('SortControl', () => {
  let mockOnSortChange: Mock<(sortBy: string, sortOrder: string) => void>;

  const sortOptionsList = [
    { label: "Name (A-Z)", sortBy: "name", sortOrder: "asc", iconTestId: "arrow-down-az-icon" },
    { label: "Name (Z-A)", sortBy: "name", sortOrder: "desc", iconTestId: "arrow-up-az-icon" },
    { label: "Last Modified (Newest)", sortBy: "updated_at", sortOrder: "desc", iconTestId: "calendar-clock-icon" },
    { label: "Last Modified (Oldest)", sortBy: "updated_at", sortOrder: "asc", iconTestId: "calendar-clock-icon" },
    { label: "Size (Largest first)", sortBy: "size", sortOrder: "desc", iconTestId: "arrow-down-wide-narrow-icon" },
    { label: "Size (Smallest first)", sortBy: "size", sortOrder: "asc", iconTestId: "arrow-up-wide-narrow-icon" },
    { label: "Type (A-Z)", sortBy: "mime_type", sortOrder: "asc", iconTestId: "file-text-icon" },
    { label: "Type (Z-A)", sortBy: "mime_type", sortOrder: "desc", iconTestId: "file-text-icon" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSortChange = vi.fn();
  });

  const renderSortControl = (currentSortBy: any, currentSortOrder: any) => {
    return render(
      <SortControl 
        currentSortBy={currentSortBy} 
        currentSortOrder={currentSortOrder} 
        onSortChange={mockOnSortChange} 
      />
    );
  };

  it('should render with default label and ChevronsUpDown icon when no sort is selected', () => {
    renderSortControl(null, null);
    expect(screen.getByText('Sort by...')).toBeInTheDocument();
    expect(screen.getByTestId('chevrons-up-down-icon')).toBeInTheDocument();
  });

  it('should render with correct label when a sort option is active', () => {
    renderSortControl('name', 'asc');
    expect(screen.getByText('Sort: Name (A-Z)')).toBeInTheDocument();
  });

  it('should render with default label if only one sort prop is provided', () => {
    let { unmount } = renderSortControl('name', null);
    expect(screen.getByText('Sort by...')).toBeInTheDocument();
    unmount(); // Clean up the first render

    ({ unmount } = renderSortControl(null, 'asc')); // Re-assign unmount from the new render
    expect(screen.getByText('Sort by...')).toBeInTheDocument();
    unmount(); // Clean up the second render
  });

  it('should open dropdown and render options when trigger button is clicked', () => {
    renderSortControl(null, null);
    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    expect(screen.getByTestId('dropdown-content')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-label')).toHaveTextContent('Sort Options');
    expect(screen.getByTestId('dropdown-separator')).toBeInTheDocument();
    
    const items = screen.getAllByTestId('dropdown-item');
    expect(items.length).toBe(sortOptionsList.length);

    sortOptionsList.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
      if (option.iconTestId) {
        // Check within the item containing the label
        const itemElement = screen.getByText(option.label).closest('[data-testid="dropdown-item"]');
        expect(itemElement?.querySelector(`[data-testid="${option.iconTestId}"]`)).toBeInTheDocument();
      }
    });
  });

  it('should call onSortChange with correct parameters when a sort option is clicked', () => {
    renderSortControl(null, null);
    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    const nameAscOption = screen.getByText('Name (A-Z)').closest('[data-testid="dropdown-item"]');
    fireEvent.click(nameAscOption!);
    expect(mockOnSortChange).toHaveBeenCalledWith('name', 'asc');

    const sizeDescOption = screen.getByText('Size (Largest first)').closest('[data-testid="dropdown-item"]');
    fireEvent.click(sizeDescOption!);
    expect(mockOnSortChange).toHaveBeenCalledWith('size', 'desc');
  });

  it('should highlight the active sort option in the dropdown', () => {
    renderSortControl('updated_at', 'desc');
    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    const activeItem = screen.getByText('Last Modified (Newest)').closest('[data-testid="dropdown-item"]');
    expect(activeItem).toHaveClass('bg-accent');

    const inactiveItem = screen.getByText('Name (A-Z)').closest('[data-testid="dropdown-item"]');
    expect(inactiveItem).not.toHaveClass('bg-accent');
  });

  it('should update button label when currentSortBy and currentSortOrder props change', () => {
    const { rerender } = renderSortControl(null, null);
    expect(screen.getByText('Sort by...')).toBeInTheDocument();

    rerender(
      <SortControl 
        currentSortBy="size" 
        currentSortOrder="asc" 
        onSortChange={mockOnSortChange} 
      />
    );
    expect(screen.getByText('Sort: Size (Smallest first)')).toBeInTheDocument();
  });
}); 