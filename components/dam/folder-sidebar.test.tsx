import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FolderSidebar, type FolderSidebarProps } from './folder-sidebar';
import { Folder } from '@/types/dam';

// Mock child components to simplify testing
vi.mock('./new-folder-dialog', () => ({
  NewFolderDialog: ({ currentFolderId }: { currentFolderId: string | null }) => (
    <button data-testid="mock-new-folder-dialog" data-current-folder-id={currentFolderId ? String(currentFolderId) : 'null'}>
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

// Mock the custom hook for FolderItem (implicitly used)
const mockSubfolders = [
    { id: 'subfolder-1', name: 'Work', user_id: 'user-123', created_at: '2023-01-03', parent_folder_id: 'folder-1', type: 'folder' as const },
    { id: 'subfolder-2', name: 'Personal', user_id: 'user-123', created_at: '2023-01-04', parent_folder_id: 'folder-1', type: 'folder' as const },
];
const mockFetchFolderChildren = vi.fn(async (folderId: string) => {
    if (folderId === 'folder-1') {
        return Promise.resolve(mockSubfolders);
    }
    return Promise.resolve([]);
});
vi.mock('@/hooks/useFolderFetch', () => ({
    useFolderFetch: () => ({
        fetchFolderChildren: mockFetchFolderChildren,
        isLoading: false,
        error: null,
    }),
}));

// --- NEW: Mock next/navigation ---
const mockUseSearchParams = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/', // Default pathname
  useSearchParams: () => mockUseSearchParams(), // Use the mock function
}));
// --- END NEW MOCK ---


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

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for useSearchParams (no folderId)
    mockUseSearchParams.mockReturnValue(new URLSearchParams()); 
  });

  it('renders root folders correctly', () => {
    render(<FolderSidebar initialFolders={mockFolders} />); // No currentFolderId
    
    expect(screen.getByText('Folders')).toBeInTheDocument();
    expect(screen.getByText('(Root)')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Images')).toBeInTheDocument();
    
    const newFolderButton = screen.getByTestId('mock-new-folder-dialog');
    expect(newFolderButton).toBeInTheDocument();
    // Check that it defaults to null if no folderId in searchParams
    expect(newFolderButton.getAttribute('data-current-folder-id')).toBe('null'); 
  });

  it('handles folder expansion and fetches subfolders', async () => {
    render(<FolderSidebar initialFolders={mockFolders} />); // No currentFolderId
    
    // More robust selector for the "Documents" folder's expand button
    const documentsLink = screen.getByText('Documents').closest('a')!;
    const buttonAndLinkContainer = documentsLink.parentElement!;
    const firstFolderExpandButton = buttonAndLinkContainer.querySelector('button')!;
    
    expect(firstFolderExpandButton).toBeInTheDocument(); // Ensure button is found
    fireEvent.click(firstFolderExpandButton);
    
    await waitFor(() => {
      expect(mockFetchFolderChildren).toHaveBeenCalledWith('folder-1');
    });
    
    await waitFor(() => {
      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument();
    });
  });

  it('applies active styling to the selected folder', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("folderId=folder-2"));
    render(<FolderSidebar initialFolders={mockFolders} />); // No currentFolderId
    
    const links = screen.getAllByTestId('mock-link');
    const imagesLink = Array.from(links).find(link => link.textContent?.includes('Images'));
    const linkContainer = imagesLink?.parentElement;
    const styledParentDiv = linkContainer?.parentElement; 

    expect(styledParentDiv?.className).toContain('bg-blue-100');
  });

  it('passes correct currentFolderId to NewFolderDialog based on searchParams', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("folderId=folder-1"));
    render(<FolderSidebar initialFolders={mockFolders} />);

    const newFolderButton = screen.getByTestId('mock-new-folder-dialog');
    expect(newFolderButton.getAttribute('data-current-folder-id')).toBe('folder-1');
  });

  it('handles fetch errors when expanding folders', async () => {
    mockFetchFolderChildren.mockRejectedValueOnce(new Error('Network error'));
    render(<FolderSidebar initialFolders={mockFolders} />); // No currentFolderId
    
    // More robust selector for the "Documents" folder's expand button
    const documentsLink = screen.getByText('Documents').closest('a')!;
    const buttonAndLinkContainer = documentsLink.parentElement!;
    const firstFolderExpandButton = buttonAndLinkContainer.querySelector('button')!;

    expect(firstFolderExpandButton).toBeInTheDocument(); // Ensure button is found
    fireEvent.click(firstFolderExpandButton);
    
    await waitFor(() => {
      expect(mockFetchFolderChildren).toHaveBeenCalledWith('folder-1');
    });
    
    await waitFor(() => {
      const errorIcon = document.querySelector('.text-red-500');
      expect(errorIcon).toBeInTheDocument();
    });
  });

  it('toggles root folder expansion', async () => {
    render(<FolderSidebar initialFolders={mockFolders} />); // No currentFolderId
    
    // More robust selector for the root folder's expand button
    const rootLink = screen.getByText('(Root)').closest('a')!;
    const rootItemContainer = rootLink.parentElement!;
    const rootExpandButton = rootItemContainer.querySelector('button')!;

    expect(rootExpandButton).toBeInTheDocument(); // Ensure button is found
    expect(screen.getByText('Documents')).toBeInTheDocument();
    
    fireEvent.click(rootExpandButton);
    await waitFor(() => {
      expect(screen.queryByText('Documents')).not.toBeInTheDocument();
    });
    
    fireEvent.click(rootExpandButton);
    await waitFor(() => {
      expect(screen.getByText('Documents')).toBeInTheDocument();
    });
  });
}); 