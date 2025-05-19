/// <reference types="vitest/globals" />
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DamTagFilter } from './DamTagFilter';
import * as tagActions from '@/lib/actions/dam/tag.actions';
import type { Tag } from '@/types/dam';

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    Filter: () => <div data-testid="icon-filter" />,
    Loader2: () => <div data-testid="icon-loader" />,
  };
});

// Mock server actions
vi.mock('@/lib/actions/dam/tag.actions');
const mockListTagsForOrganization = vi.mocked(tagActions.listTagsForOrganization);

const mockOrgTags: Tag[] = [
  { id: 'tag1', name: 'Photography', organization_id: 'org1', user_id: 'user1', created_at: 't1' },
  { id: 'tag2', name: 'Illustration', organization_id: 'org1', user_id: 'user1', created_at: 't2' },
  { id: 'tag3', name: 'Video', organization_id: 'org1', user_id: 'user1', created_at: 't3' },
];

const defaultProps = {
  activeOrgId: 'org1',
  initialSelectedTagIdsFromUrl: new Set<string>(),
  onFilterChange: vi.fn(),
  tooltipText: 'Filter by tags',
};

describe('DamTagFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTagsForOrganization.mockResolvedValue({ success: true, data: [...mockOrgTags] });
  });

  const openPopover = () => {
    // Button name includes badge count when filters active, e.g., "1 Filter by tags"
    const triggerButton = screen.getByRole('button', { name: new RegExp(defaultProps.tooltipText) });
    fireEvent.click(triggerButton);
  };

  it('renders trigger button and no badge initially if no filters selected', () => {
    render(<DamTagFilter {...defaultProps} />);
    expect(screen.getByRole('button', { name: defaultProps.tooltipText })).toBeInTheDocument();
    expect(screen.getByTestId('icon-filter')).toBeInTheDocument();
    expect(screen.queryByText(String(defaultProps.initialSelectedTagIdsFromUrl.size))).not.toBeInTheDocument(); // Badge count
  });

  it('renders trigger button with correct badge count if filters are initially selected', () => {
    const initialFilters = new Set(['tag1']);
    render(<DamTagFilter {...defaultProps} initialSelectedTagIdsFromUrl={initialFilters} />);
    expect(screen.getByText(String(initialFilters.size))).toBeInTheDocument(); // Badge count
  });

  it('opens popover and fetches tags on trigger click', async () => {
    render(<DamTagFilter {...defaultProps} />);
    openPopover();
    await waitFor(() => {
      expect(mockListTagsForOrganization).toHaveBeenCalledWith('org1');
      expect(screen.getByText('Filter by Tags')).toBeInTheDocument(); // Popover title
      mockOrgTags.forEach(tag => {
        expect(screen.getByLabelText(tag.name)).toBeInTheDocument();
      });
    });
  });

  it('shows loading state while fetching tags', async () => {
    mockListTagsForOrganization.mockImplementationOnce(() => new Promise(() => {})); // Keep promise pending
    render(<DamTagFilter {...defaultProps} />);
    openPopover();
    await waitFor(() => {
      expect(screen.getByText('Loading tags...')).toBeInTheDocument();
      expect(screen.getByTestId('icon-loader')).toBeInTheDocument();
    });
  });

  it('shows "No tags available" if fetching fails or no tags exist', async () => {
    mockListTagsForOrganization.mockResolvedValueOnce({ success: true, data: [] });
    render(<DamTagFilter {...defaultProps} />);
    openPopover();
    await waitFor(() => {
      expect(screen.getByText('No tags available for this organization.')).toBeInTheDocument();
    });
  });

  it('allows selecting and deselecting tags in popover', async () => {
    render(<DamTagFilter {...defaultProps} />);
    openPopover();
    await waitFor(() => expect(screen.getByRole('checkbox', { name: mockOrgTags[0].name })).toBeInTheDocument());

    const firstTagCheckbox = screen.getByRole('checkbox', { name: mockOrgTags[0].name });
    const secondTagCheckbox = screen.getByRole('checkbox', { name: mockOrgTags[1].name });

    // Initially unchecked
    expect(firstTagCheckbox).not.toBeChecked();
    fireEvent.click(firstTagCheckbox);
    expect(firstTagCheckbox).toBeChecked();

    // Deselect first tag
    fireEvent.click(firstTagCheckbox);
    expect(firstTagCheckbox).not.toBeChecked();
  });

  it('calls onFilterChange with selected tags and closes popover on Apply', async () => {
    render(<DamTagFilter {...defaultProps} />);
    openPopover();
    await waitFor(() => expect(screen.getByLabelText(mockOrgTags[0].name)).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText(mockOrgTags[0].name)); // Select tag1
    fireEvent.click(screen.getByLabelText(mockOrgTags[2].name)); // Select tag3

    const applyButton = screen.getByRole('button', { name: 'Apply' });
    fireEvent.click(applyButton);

    expect(defaultProps.onFilterChange).toHaveBeenCalledWith(new Set(['tag1', 'tag3']));
    await waitFor(() => {
      expect(screen.queryByText('Filter by Tags')).not.toBeInTheDocument(); // Popover closed
    });
  });

  it('calls onFilterChange with empty set and closes popover on Clear', async () => {
    render(<DamTagFilter {...defaultProps} initialSelectedTagIdsFromUrl={new Set(['tag1'])} />); // Start with a selection
    openPopover();
    await waitFor(() => expect(screen.getByLabelText(mockOrgTags[0].name)).toBeInTheDocument());
    
    // Ensure the initial selection is reflected in the popover
    const firstTagCheckbox = screen.getByRole('checkbox', { name: mockOrgTags[0].name });
    expect(firstTagCheckbox).toBeChecked();

    const clearButton = screen.getByRole('button', { name: 'Clear' });
    fireEvent.click(clearButton);

    expect(defaultProps.onFilterChange).toHaveBeenCalledWith(new Set());
    await waitFor(() => {
      expect(screen.queryByText('Filter by Tags')).not.toBeInTheDocument(); // Popover closed
    });
  });

  it('syncs popover selection with initialSelectedTagIdsFromUrl when popover opens', async () => {
    const initialFilters = new Set([mockOrgTags[1].id]);
    const { rerender } = render(<DamTagFilter {...defaultProps} initialSelectedTagIdsFromUrl={new Set()} />); 
    openPopover();
    await waitFor(() => expect(screen.getByRole('checkbox', { name: mockOrgTags[1].name })).toBeInTheDocument());
    let tagCheckbox = screen.getByRole('checkbox', { name: mockOrgTags[1].name });
    expect(tagCheckbox).not.toBeChecked(); // Initially not checked

    // Close popover by clicking trigger again
    fireEvent.click(screen.getByRole('button', { name: defaultProps.tooltipText }));
    await waitFor(() => expect(screen.queryByText('Filter by Tags')).not.toBeInTheDocument());

    // Rerender with new initial filters
    rerender(<DamTagFilter {...defaultProps} initialSelectedTagIdsFromUrl={initialFilters} />);
    openPopover(); // Reopen
    await waitFor(() => expect(screen.getByRole('checkbox', { name: mockOrgTags[1].name })).toBeInTheDocument());
    tagCheckbox = screen.getByRole('checkbox', { name: mockOrgTags[1].name });
    expect(tagCheckbox).toBeChecked(); // Should now be checked
  });

}); 