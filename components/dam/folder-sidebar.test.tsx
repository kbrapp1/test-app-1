import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FolderSidebar } from './folder-sidebar';
import { Folder } from '@/types/dam';

// Mock the fetch function
global.fetch = vi.fn();

// Mock child components to simplify testing
vi.mock('./new-folder-dialog', () => ({
  NewFolderDialog: ({ currentFolderId }: { currentFolderId: string | null }) => (
    <button data-testid="mock-new-folder-dialog" data-current-folder-id={currentFolderId}>
      New Folder
    </button>
  ),
}));

// Mock toast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock Next.js Link component
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className} data-testid="mock-link">
      {children}
    </a>
  ),
}));

describe('FolderSidebar Component', () => {
  // Test data
  const mockFolders: Folder[] = [
    {
      id: 'folder-1',
      name: 'Documents',
      user_id: 'user-123',
      created_at: '2023-01-01',
      parent_folder_id: null,
      type: 'folder'
    },
    {
      id: 'folder-2',
      name: 'Images',
      user_id: 'user-123',
      created_at: '2023-01-02',
      parent_folder_id: null,
      type: 'folder'
    },
  ];

  // Mock response for the fetch API
  const mockSubfolders = [
    {
      id: 'subfolder-1',
      name: 'Work',
      user_id: 'user-123',
      created_at: '2023-01-03',
      parent_folder_id: 'folder-1',
      type: 'folder'
    },
    {
      id: 'subfolder-2',
      name: 'Personal',
      user_id: 'user-123',
      created_at: '2023-01-04',
      parent_folder_id: 'folder-1',
      type: 'folder'
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset the fetch mock
    (global.fetch as any).mockReset();
  });

  it('renders root folders correctly', () => {
    render(<FolderSidebar initialFolders={mockFolders} currentFolderId={null} />);
    
    // Check if sidebar title is rendered
    expect(screen.getByText('Folders')).toBeInTheDocument();
    
    // Check if root link is rendered
    expect(screen.getByText('(Root)')).toBeInTheDocument();
    
    // Check if folders are rendered
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Images')).toBeInTheDocument();
    
    // Check if the new folder dialog is rendered with correct props
    const newFolderButton = screen.getByTestId('mock-new-folder-dialog');
    expect(newFolderButton).toBeInTheDocument();
    expect(newFolderButton.getAttribute('data-current-folder-id')).toBeNull();
  });

  it('handles folder expansion and fetches subfolders', async () => {
    // Mock the fetch response for subfolders
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSubfolders),
    });

    render(<FolderSidebar initialFolders={mockFolders} currentFolderId={null} />);
    
    // Find and click the expand button for the first folder
    const expandButtons = screen.getAllByRole('button');
    const firstFolderExpandButton = expandButtons[1]; // Index 1 because the first one is for root
    
    fireEvent.click(firstFolderExpandButton);
    
    // Verify fetch was called with the correct URL
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/dam?folderId=folder-1');
    });
    
    // Wait for the subfolders to be rendered
    await waitFor(() => {
      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument();
    });
  });

  it('applies active styling to the selected folder', () => {
    render(<FolderSidebar initialFolders={mockFolders} currentFolderId="folder-2" />);
    
    // Get all folder links
    const links = screen.getAllByTestId('mock-link');
    
    // Find the link for "Images" folder (folder-2)
    const imagesLink = Array.from(links).find(link => link.textContent?.includes('Images'));
    
    // Verify it has the active class styling (check if the parent div has the bg-blue class)
    const imagesLinkParent = imagesLink?.closest('div');
    expect(imagesLinkParent?.className).toContain('bg-blue');
  });

  it('handles fetch errors when expanding folders', async () => {
    // Mock fetch to reject with an error
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
    
    // Mock console.error to prevent test output pollution
    const originalConsoleError = console.error;
    console.error = vi.fn();
    
    render(<FolderSidebar initialFolders={mockFolders} currentFolderId={null} />);
    
    // Find and click the expand button for the first folder
    const expandButtons = screen.getAllByRole('button');
    const firstFolderExpandButton = expandButtons[1]; // Index 1 because the first one is for root
    
    fireEvent.click(firstFolderExpandButton);
    
    // Verify fetch was called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    
    // Wait for the error indicator to be shown
    await waitFor(() => {
      // The error icon (AlertCircle) should be visible
      const errorIcon = document.querySelector('.text-red-500');
      expect(errorIcon).toBeInTheDocument();
    });
    
    // Restore console.error
    console.error = originalConsoleError;
  });

  it('toggles root folder expansion', () => {
    render(<FolderSidebar initialFolders={mockFolders} currentFolderId={null} />);
    
    // Find the root expand button
    const rootExpandButton = screen.getAllByRole('button')[0];
    
    // Initially, root folders should be visible
    expect(screen.getByText('Documents')).toBeInTheDocument();
    
    // Click to collapse
    fireEvent.click(rootExpandButton);
    
    // Root folders should be hidden
    expect(screen.queryByText('Documents')).not.toBeInTheDocument();
    
    // Click to expand again
    fireEvent.click(rootExpandButton);
    
    // Root folders should be visible again
    expect(screen.getByText('Documents')).toBeInTheDocument();
  });
}); 