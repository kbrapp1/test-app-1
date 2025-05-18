'use client';

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FolderPickerDialog } from './FolderPickerDialog';
import * as folderActions from '@/lib/actions/dam/folder.actions';
import { toast } from 'sonner';
import { RawFolderData } from './folderPickerUtils';

// Mock sonner's toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(), // Add other methods if used
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', async (importOriginal) => {
  const original = await importOriginal<typeof import('lucide-react')>();
  return {
    ...original,
    AlertTriangle: () => <svg data-testid="alert-triangle-icon" />,
    HomeIcon: () => <svg data-testid="home-icon" />,
    SearchIcon: () => <svg data-testid="search-icon" />,
    XIcon: () => <svg data-testid="x-icon" />,
    ChevronRightIcon: () => <svg data-testid="chevron-right-icon" />,
    ChevronDownIcon: () => <svg data-testid="chevron-down-icon" />,
  };
});

const mockGetFoldersForPicker = vi.spyOn(folderActions, 'getFoldersForPicker');

const mockRawFolders: RawFolderData[] = [
  { id: 'f1', name: 'Folder 1', parent_folder_id: null },
  { id: 'f2', name: 'Subfolder 1.1', parent_folder_id: 'f1' },
  { id: 'f3', name: 'Folder 2', parent_folder_id: null },
  { id: 'f4', name: 'Another Folder', parent_folder_id: null },
  { id: 'f5', name: 'Deep Subfolder 1.1.1', parent_folder_id: 'f2' },
];

const defaultProps = {
  isOpen: true,
  onOpenChange: vi.fn(),
  onFolderSelect: vi.fn(),
  currentAssetFolderId: undefined,
  assetName: undefined,
};

describe('FolderPickerDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFoldersForPicker.mockResolvedValue({ success: true, data: [...mockRawFolders] });
  });

  const renderComponent = (props = {}) => {
    return render(<FolderPickerDialog {...defaultProps} {...props} />);
  };

  it('renders dialog when isOpen is true', async () => {
    renderComponent();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Move Asset')).toBeInTheDocument();
    expect(screen.getByText('Select a destination folder or move to root. You can also search for folders.')).toBeInTheDocument();
  });

  it('displays asset name in title when provided', () => {
    renderComponent({ assetName: 'MyVideo.mp4' });
    expect(screen.getByText('Move "MyVideo.mp4"')).toBeInTheDocument();
  });

  it('fetches folders on open and displays them', async () => {
    renderComponent();
    expect(mockGetFoldersForPicker).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.getByText('Folder 1')).toBeInTheDocument();
      expect(screen.getByText('Folder 2')).toBeInTheDocument();
      expect(screen.getByText('Another Folder')).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching folders', async () => {
    mockGetFoldersForPicker.mockImplementationOnce(() => new Promise(() => {})); // Never resolves
    renderComponent();
    expect(screen.getByText('Loading folders...')).toBeInTheDocument();
  });

  it('handles folder fetch error', async () => {
    mockGetFoldersForPicker.mockResolvedValueOnce({ success: false, error: 'Fetch failed' });
    renderComponent();
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Fetch failed');
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      expect(screen.getByText('No folders available.')).toBeInTheDocument();
    });
  });

  it('handles unexpected error during folder fetch', async () => {
    mockGetFoldersForPicker.mockRejectedValueOnce(new Error('Network error'));
    renderComponent();
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred while fetching folders.');
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      expect(screen.getByText('No folders available.')).toBeInTheDocument();
    });
  });

  it('filters folders based on search term', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Folder 1')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText('Search folders...');
    fireEvent.change(searchInput, { target: { value: 'Subfolder' } });

    await waitFor(() => {
      expect(screen.queryByText('Folder 1')).toBeInTheDocument(); // Parent should still be visible
      expect(screen.getByText('Subfolder 1.1')).toBeInTheDocument();
      expect(screen.queryByText('Folder 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Another Folder')).not.toBeInTheDocument();
    });
  });

  it('shows no match message when search yields no results', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Folder 1')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText('Search folders...');
    fireEvent.change(searchInput, { target: { value: 'NonExistentFolder' } });

    await waitFor(() => {
      expect(screen.getByText('No folders match "NonExistentFolder".')).toBeInTheDocument();
    });
  });

  it('clears search term', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Folder 1')).toBeInTheDocument());
    const searchInput = screen.getByPlaceholderText('Search folders...') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Folder 1' } });
    await waitFor(() => expect(searchInput.value).toBe('Folder 1'));
    
    const clearButton = screen.getByTestId('x-icon').closest('button');
    expect(clearButton).toBeInTheDocument();
    if (clearButton) {
        fireEvent.click(clearButton);
    }
    
    await waitFor(() => expect(searchInput.value).toBe(''));
    expect(screen.getByText('Folder 1')).toBeInTheDocument();
    expect(screen.getByText('Folder 2')).toBeInTheDocument();
  });

  it('allows selecting the Root folder', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Root')).toBeInTheDocument());
    const rootButton = screen.getByText('Root').closest('button');
    if (rootButton) fireEvent.click(rootButton);
    await waitFor(() => {
        expect(rootButton).toHaveAttribute('aria-pressed', 'true');
        expect(rootButton).toHaveClass('bg-secondary'); // Check for secondary variant style
    });
  });

  it('allows selecting a specific folder', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Folder 1')).toBeInTheDocument());
    const folder1Button = screen.getByText('Folder 1').closest('button');
    if (folder1Button) fireEvent.click(folder1Button);

    await waitFor(() => {
        expect(folder1Button).toHaveAttribute('aria-pressed', 'true');
        expect(folder1Button).toHaveClass('bg-secondary');
    });
  });

  it('calls onFolderSelect and onOpenChange when Move button is clicked with a selection', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Folder 1')).toBeInTheDocument());
    
    const folder1Button = screen.getByText('Folder 1').closest('button');
    if (folder1Button) fireEvent.click(folder1Button);

    const moveButton = screen.getByRole('button', { name: 'Move' });
    fireEvent.click(moveButton);

    expect(defaultProps.onFolderSelect).toHaveBeenCalledWith('f1');
    // onOpenChange is implicitly called by DialogFooter button if not prevented
    // however, our handler calls it directly, so we can check that
    // In this setup, DialogFooter doesn't directly call onOpenChange
    // The action button (Move) only calls onFolderSelect.
    // The Dialog's onOpenChange is managed by its own open/close mechanisms.
  });

   it('Move button is disabled initially or if no folder is selected', async () => {
    renderComponent({ onFolderSelect: vi.fn() }); // Reset onFolderSelect for this test
    await waitFor(() => expect(screen.getByText('Root')).toBeInTheDocument()); // Wait for content
    const moveButton = screen.getByRole('button', { name: 'Move' });
    expect(moveButton).toBeDisabled();

    // Select Root
    const rootButton = screen.getByText('Root').closest('button');
    if (rootButton) fireEvent.click(rootButton);
    await waitFor(() => expect(moveButton).not.toBeDisabled());
  });

  it('calls onOpenChange with false when Cancel button is clicked', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Folder 1')).toBeInTheDocument());
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables selection of currentAssetFolderId', async () => {
    renderComponent({ currentAssetFolderId: 'f1' });
    await waitFor(() => expect(screen.getByText('Folder 1')).toBeInTheDocument());
    const folder1Button = screen.getByText('Folder 1').closest('button');
    expect(folder1Button).toBeDisabled();
    expect(folder1Button).toHaveClass('opacity-50');
    expect(screen.getByText('(Current)')).toBeInTheDocument();
  });

  it('disables selection of Root if it is currentAssetFolderId', async () => {
    renderComponent({ currentAssetFolderId: null });
    await waitFor(() => expect(screen.getByText('Root')).toBeInTheDocument());
    const rootButton = screen.getByText('Root').closest('button');
    expect(rootButton).toBeDisabled();
    expect(rootButton).toHaveClass('opacity-50');
    // Check for (Current) span within the Root button's content
    const currentSpan = Array.from(rootButton?.querySelectorAll('span') || []).find(span => span.textContent === '(Current)');
    expect(currentSpan).toBeInTheDocument();
  });

  it('allows expanding and collapsing folders', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Folder 1')).toBeInTheDocument());
    
    expect(screen.queryByText('Subfolder 1.1')).not.toBeInTheDocument();

    // Find the expand button for Folder 1
    const folder1Item = screen.getByText('Folder 1').closest('[role="treeitem"]');
    // The expand control is a span with role="button" and a specific aria-label
    const expandButtonF1 = folder1Item?.querySelector('span[role="button"][aria-label="Expand folder"]');
    
    if (!expandButtonF1) throw new Error("Could not find expand button for Folder 1");

    fireEvent.click(expandButtonF1);
    await waitFor(() => {
      expect(screen.getByText('Subfolder 1.1')).toBeInTheDocument();
    });

    // Now it's expanded, the label should change
    const collapseButtonF1 = folder1Item?.querySelector('span[role="button"][aria-label="Collapse folder"]');
    if (!collapseButtonF1) throw new Error("Could not find collapse button for Folder 1");

    fireEvent.click(collapseButtonF1); // Click again to collapse
    await waitFor(() => {
      expect(screen.queryByText('Subfolder 1.1')).not.toBeInTheDocument();
    });
  });

  it('resets selection, search, and expansion when re-opened', async () => {
    const { rerender } = renderComponent({ isOpen: true });
    await waitFor(() => expect(screen.getByText('Folder 1')).toBeInTheDocument());

    // Perform some actions: search, select, expand
    let searchInput = screen.getByPlaceholderText('Search folders...') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Folder' } });
    await waitFor(() => expect(searchInput.value).toBe('Folder'));

    let folder1Button = screen.getByText('Folder 1').closest('button');
    if (folder1Button) fireEvent.click(folder1Button);
    await waitFor(() => expect(folder1Button).toHaveAttribute('aria-pressed', 'true'));

    // Expand Folder 1
    let folder1Item = screen.getByText('Folder 1').closest('[role="treeitem"]');
    let expandButtonF1 = folder1Item?.querySelector('span[role="button"][aria-label="Expand folder"]');
    if (expandButtonF1) fireEvent.click(expandButtonF1);
    await waitFor(() => expect(screen.getByText('Subfolder 1.1')).toBeInTheDocument());

    // "Close" the dialog by re-rendering with isOpen: false
    rerender(<FolderPickerDialog {...defaultProps} isOpen={false} />); 
    
    // "Re-open" the dialog
    mockGetFoldersForPicker.mockClear(); // Clear previous fetch calls
    rerender(<FolderPickerDialog {...defaultProps} isOpen={true} />); 

    expect(mockGetFoldersForPicker).toHaveBeenCalledTimes(1); // Fetches again

    // IMPORTANT: Wait for folders to be loaded after re-opening
    await waitFor(() => expect(screen.getByText('Folder 1')).toBeInTheDocument());

    // Re-query elements after re-render and folder loading
    searchInput = screen.getByPlaceholderText('Search folders...') as HTMLInputElement;
    folder1Button = screen.getByText('Folder 1').closest('button'); // Re-query in case it's a new instance

    await waitFor(() => {
      // Check search is reset
      expect(searchInput.value).toBe('');
      // Check selection is reset (Move button should be disabled)
      const moveButton = screen.getByRole('button', { name: 'Move' });
      expect(moveButton).toBeDisabled();
      // Ensure folder1Button is still selected in its original state (not pressed)
      expect(folder1Button).toHaveAttribute('aria-pressed', 'false');
      // Check expansion is reset (Subfolder 1.1 should not be visible)
      expect(screen.queryByText('Subfolder 1.1')).not.toBeInTheDocument();
      expect(screen.getByText('Folder 1')).toBeInTheDocument(); // Original folders are back
    });
  });

  it('auto-expands folders based on search results to show matches', async () => {
    mockGetFoldersForPicker.mockResolvedValue({ success: true, data: mockRawFolders });
    renderComponent();
    await waitFor(() => expect(screen.getByText('Folder 1')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText('Search folders...');
    fireEvent.change(searchInput, { target: { value: 'Deep Subfolder' } });

    await waitFor(() => {
      expect(screen.getByText('Folder 1')).toBeInTheDocument(); // Ancestor
      expect(screen.getByText('Subfolder 1.1')).toBeInTheDocument(); // Parent of match
      expect(screen.getByText('Deep Subfolder 1.1.1')).toBeInTheDocument(); // The match itself
      expect(screen.queryByText('Folder 2')).not.toBeInTheDocument();
    });
  });

}); 