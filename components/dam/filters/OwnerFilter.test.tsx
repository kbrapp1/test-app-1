'use client';

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OwnerFilter } from './OwnerFilter';

// --- Mocks ---
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    UsersIcon: (props: any) => <div data-testid="users-icon" {...props} />,
    XIcon: (props: any) => <div data-testid="x-icon" {...props} />,
  };
});

vi.mock('@/components/ui/dropdown-menu', () => {
  let MockedDropdownMenuRadioItemLocal: any;

  const MockedDropdownMenuRadioGroupLocal = vi.fn(({ value, onValueChange, children, className }) => {
    const processChildren = (childNodes: React.ReactNode): React.ReactNode => {
      return React.Children.map(childNodes, (child) => {
        if (!React.isValidElement(child)) {
          return child;
        }
        // child is now React.ReactElement
        const props = child.props as { children?: React.ReactNode; [key: string]: any; }; // Explicitly type props

        // Check if the child itself is the item we're looking for
        if (child.type === MockedDropdownMenuRadioItemLocal) {
          // Ensure __onGroupValueChange__ is added to existing props
          return React.cloneElement(child as React.ReactElement<any>, { ...props, __onGroupValueChange__: onValueChange });
        }
        
        // If the child has its own children, recursively process them
        if (props.children) { // Check if props.children exists (truthy check)
          const newChildProps = { ...props }; // Create a new props object to modify
          newChildProps.children = processChildren(props.children);
          return React.cloneElement(child, newChildProps);
        }
        return child;
      });
    };

    return (
      <div data-testid="radio-group" data-current-value={value} className={className}>
        {processChildren(children)}
      </div>
    );
  });

  MockedDropdownMenuRadioItemLocal = vi.fn(({ children, value, className, __onGroupValueChange__, ...rest }) => (
    <div 
      data-testid={`radio-item-${value || 'anyone'}`} 
      data-value={value} 
      className={className} 
      onClick={() => __onGroupValueChange__?.(value)}
      {...rest}
    >
      {children}
    </div>
  ));

  return {
    DropdownMenu: vi.fn(({ children, open, onOpenChange }) => (
        <div data-testid="dropdown-menu" data-open={open} onClick={() => onOpenChange(!open)}>
          {children}
        </div>
    )),
    DropdownMenuTrigger: vi.fn(({ children }) => <div data-testid="dropdown-trigger">{children}</div>),
    DropdownMenuContent: vi.fn(({ children, className }) => <div data-testid="dropdown-content" className={className}>{children}</div>),
    DropdownMenuRadioGroup: MockedDropdownMenuRadioGroupLocal,
    DropdownMenuRadioItem: MockedDropdownMenuRadioItemLocal,
    DropdownMenuLabel: vi.fn(({ children }) => <div data-testid="dropdown-label">{children}</div>),
    DropdownMenuSeparator: vi.fn(() => <hr data-testid="dropdown-separator" />),
  };
});

// Mock Tooltip components
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: vi.fn(({ children }) => <div data-testid="tooltip-provider">{children}</div>),
  Tooltip: vi.fn(({ children }) => <div data-testid="tooltip">{children}</div>),
  TooltipTrigger: vi.fn(({ children, asChild }) => 
    asChild ? <>{children}</> : <div data-testid="tooltip-trigger">{children}</div>
  ),
  TooltipContent: vi.fn(({ children, side, align }) => <div data-testid="tooltip-content" data-side={side} data-align={align}>{children}</div>),
}));

vi.mock('@/components/ui/button', () => ({
  Button: vi.fn(({ children, onClick, variant, className, 'aria-label': ariaLabel }) => (
    <button 
      data-testid={ariaLabel === 'Clear owner filter' ? 'clear-x-button' : 'button'} 
      onClick={onClick} 
      data-variant={variant} 
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )),
}));

const mockMembers = [
  { id: 'member1', name: 'Alice Wonderland' },
  { id: 'member2', name: 'Bob The Builder' },
  { id: 'member3', name: 'Charles Xavier Professor Longname' }, // For truncation test
];

// --- Test Suite ---
describe('OwnerFilter', () => {
  let mockOnOwnerChange: ReturnType<typeof vi.fn<(ownerId: string | undefined) => void>>;

  const renderOwnerFilter = (props: Partial<Parameters<typeof OwnerFilter>[0]> = {}) => {
    const defaultProps: Parameters<typeof OwnerFilter>[0] = {
      selectedOwnerId: undefined,
      onOwnerChange: mockOnOwnerChange,
      members: mockMembers,
    };
    return render(<OwnerFilter {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    vi.useFakeTimers();
    mockOnOwnerChange = vi.fn();
    // The mocks for DropdownMenuRadioGroup and DropdownMenuRadioItem are now self-contained in their factory
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // --- Initial Rendering and Button Label Tests ---
  it('should render trigger button with default label "Anyone"', () => {
    renderOwnerFilter({ members: [] });
    expect(screen.getByTestId('button')).toHaveTextContent('Owner: Anyone');
    expect(screen.queryByTestId('clear-x-button')).not.toBeInTheDocument();
  });

  it('should display member name in button if selected and member exists', () => {
    renderOwnerFilter({ selectedOwnerId: 'member1' });
    expect(screen.getByTestId('button')).toHaveTextContent(`Owner: ${mockMembers[0].name}`);
  });

  it('should display truncated member name if long', () => {
    renderOwnerFilter({ selectedOwnerId: 'member3' });
    expect(screen.getByTestId('button')).toHaveTextContent('Owner: Charles Xavier Profess...');
  });

  it('should display truncated ID if selectedOwnerId does not match any member', () => {
    renderOwnerFilter({ selectedOwnerId: 'unknownUser123' });
    expect(screen.getByTestId('button')).toHaveTextContent('Owner: unknownU...');
  });
  
  it('should show X clear button if a filter is active', () => {
    renderOwnerFilter({ selectedOwnerId: 'member1' });
    expect(screen.getByTestId('clear-x-button')).toBeInTheDocument();
  });

  // --- Dropdown Interaction ---
  it('should open dropdown and render options', () => {
    renderOwnerFilter();
    fireEvent.click(screen.getByTestId('button')); // Open dropdown
    expect(screen.getByTestId('dropdown-menu')).toHaveAttribute('data-open', 'true');
    expect(screen.getByTestId('radio-item-anyone')).toHaveTextContent('Anyone');
    expect(screen.getByTestId('dropdown-separator')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-label')).toHaveTextContent('Organization Members');
    mockMembers.forEach(member => {
      expect(screen.getByTestId(`radio-item-${member.id}`)).toHaveTextContent(member.name);
    });
  });

  it('should not render member list, separator, or label if no members provided', () => {
    renderOwnerFilter({ members: [] });
    fireEvent.click(screen.getByTestId('button'));
    expect(screen.getByTestId('radio-item-anyone')).toBeInTheDocument();
    expect(screen.queryByTestId('dropdown-separator')).not.toBeInTheDocument();
    expect(screen.queryByTestId('dropdown-label')).not.toBeInTheDocument();
    if (mockMembers.length > 0) { 
        expect(screen.queryByTestId(`radio-item-${mockMembers[0].id}`)).not.toBeInTheDocument();
    }
  });

  it('selecting "Anyone" calls onOwnerChange with undefined and closes dropdown', () => {
    renderOwnerFilter({ selectedOwnerId: 'member1' }); 
    fireEvent.click(screen.getByTestId('button'));
    const anyoneItem = screen.getByTestId('radio-item-anyone');
    fireEvent.click(anyoneItem); 
    expect(mockOnOwnerChange).toHaveBeenCalledWith(undefined);
    expect(screen.getByTestId('dropdown-menu')).toHaveAttribute('data-open', 'false');
  });

  it('selecting a member calls onOwnerChange with memberId and closes dropdown', () => {
    renderOwnerFilter();
    fireEvent.click(screen.getByTestId('button'));
    const memberItem = screen.getByTestId(`radio-item-${mockMembers[1].id}`);
    fireEvent.click(memberItem);
    expect(mockOnOwnerChange).toHaveBeenCalledWith(mockMembers[1].id);
    expect(screen.getByTestId('dropdown-menu')).toHaveAttribute('data-open', 'false');
  });

  // --- Clear X Button ---
  it('clicking X clear button calls onOwnerChange(undefined) and closes dropdown', () => {
    renderOwnerFilter({ selectedOwnerId: 'member1' });
    const clearButton = screen.getByTestId('clear-x-button');
    fireEvent.click(clearButton);
    expect(mockOnOwnerChange).toHaveBeenCalledWith(undefined);
    expect(screen.getByTestId('dropdown-menu')).toHaveAttribute('data-open', 'false');
  });

  // --- Tooltip presence (not interaction) ---
  it('should render Tooltip components for each member', () => {
    renderOwnerFilter();
    fireEvent.click(screen.getByTestId('button')); // Open dropdown
    const providers = screen.getAllByTestId('tooltip-provider');
    const tooltips = screen.getAllByTestId('tooltip');
    const contents = screen.getAllByTestId('tooltip-content');
    expect(providers.length).toBe(mockMembers.length);
    expect(tooltips.length).toBe(mockMembers.length);
    expect(contents.length).toBe(mockMembers.length);
    expect(contents[0]).toHaveTextContent(mockMembers[0].name);
  });
}); 