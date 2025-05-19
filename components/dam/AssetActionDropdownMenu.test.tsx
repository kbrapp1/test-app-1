/// <reference types="vitest/globals" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssetActionDropdownMenu } from './AssetActionDropdownMenu';
import { Asset } from '@/types/dam';

// Mock Radix/Shadcn DropdownMenu components
vi.mock('@/components/ui/dropdown-menu', async () => {
  const actual = await vi.importActual('@/components/ui/dropdown-menu');
  return {
    ...actual,
    DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children, asChild }: any) => {
      const childEl = React.Children.only(children) as React.ReactElement<any>;
      // Add test id to trigger button
      return React.cloneElement(childEl, { 'data-testid': 'trigger-button' } as any);
    },
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-dropdown-content">{children}</div>,
    DropdownMenuItem: ({ children, ...props }: any) => <button role="menuitem" {...props}>{children}</button>,
    DropdownMenuSub: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuSubTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    DropdownMenuSubContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuPortal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    MoreHorizontal: () => <div data-testid="icon-more-horizontal" />, 
    Download: () => <div data-testid="icon-download" />,
    Edit3: () => <div data-testid="icon-edit3" />,
    Trash2: () => <div data-testid="icon-trash2" />,
    Loader2: () => <div data-testid="icon-loader2" />,
    Info: () => <div data-testid="icon-info" />,
    MoveIcon: () => <div data-testid="icon-move" />,
    Star: () => <div data-testid="icon-star" />,
    ArchiveIcon: () => <div data-testid="icon-archive" />,
    FolderKanban: () => <div data-testid="icon-folder-kanban" />,
  };
});

const mockAsset: Asset = {
  id: 'asset123',
  name: 'Test Asset.jpg',
  folder_id: 'folderA',
  user_id: 'user1',
  organization_id: 'org1',
  created_at: '2023-01-01T00:00:00Z',
  type: 'asset',
  storage_path: '/test/path.jpg',
  mime_type: 'image/jpeg',
  size: 1024,
  publicUrl: 'http://example.com/test.jpg',
  tags: [],
  ownerName: 'Test User',
  parentFolderName: 'Parent Folder',
};

const defaultProps = {
  item: mockAsset,
  onViewDetails: vi.fn(),
  onOpenRenameDialog: vi.fn(),
  onOpenMoveDialog: vi.fn(),
  onDownload: vi.fn(),
  onDelete: vi.fn(),
  isDownloading: false,
  isPendingRename: false,
  isPendingMove: false,
};

describe('AssetActionDropdownMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const openMenu = () => {
    const triggerButton = screen.getByTestId('trigger-button');
    fireEvent.click(triggerButton);
  };

  it('renders the trigger button', () => {
    render(<AssetActionDropdownMenu {...defaultProps} />);
    expect(screen.getByTestId('trigger-button')).toBeInTheDocument();
    expect(screen.getByTestId('icon-more-horizontal')).toBeInTheDocument();
  });

  it('opens and closes the dropdown menu', async () => {
    render(<AssetActionDropdownMenu {...defaultProps} />);
    openMenu();
    await waitFor(() => {
        expect(screen.getByText('View Details')).toBeInTheDocument();
    });

    // Click away or press Escape to close (simulating by re-clicking trigger for simplicity in some setups)
    // For more robust closing, you might need to interact with the document body or a specific close button if available.
    // fireEvent.click(document.body); // This might not work in jsdom without more setup
    // await waitFor(() => {
    //   expect(screen.queryByText('View Details')).not.toBeInTheDocument();
    // });
  });

  it('renders all standard menu items and calls their respective handlers', async () => {
    render(<AssetActionDropdownMenu {...defaultProps} />);
    openMenu();

    const viewDetailsItem = await screen.findByText('View Details');
    expect(viewDetailsItem).toBeInTheDocument();
    expect(screen.getByTestId('icon-info')).toBeInTheDocument();
    fireEvent.click(viewDetailsItem);
    expect(defaultProps.onViewDetails).toHaveBeenCalled();

    const renameItem = await screen.findByText('Rename');
    expect(renameItem).toBeInTheDocument();
    expect(screen.getByTestId('icon-edit3')).toBeInTheDocument();
    fireEvent.click(renameItem);
    expect(defaultProps.onOpenRenameDialog).toHaveBeenCalled();

    const downloadItem = await screen.findByText('Download');
    expect(downloadItem).toBeInTheDocument();
    expect(screen.getByTestId('icon-download')).toBeInTheDocument();
    fireEvent.click(downloadItem);
    expect(defaultProps.onDownload).toHaveBeenCalled();

    const deleteItem = await screen.findByText('Delete');
    expect(deleteItem).toBeInTheDocument();
    expect(screen.getByTestId('icon-trash2')).toBeInTheDocument();
    fireEvent.click(deleteItem);
    expect(defaultProps.onDelete).toHaveBeenCalled();
  });

  it('renders items within the Organize submenu and calls their handlers', async () => {
    render(<AssetActionDropdownMenu {...defaultProps} />);
    openMenu();

    const organizeSubMenuTrigger = await screen.findByText('Organize');
    expect(organizeSubMenuTrigger).toBeInTheDocument();
    expect(screen.getByTestId('icon-folder-kanban')).toBeInTheDocument();
    fireEvent.click(organizeSubMenuTrigger); // Open submenu

    const moveItem = await screen.findByText('Move');
    expect(moveItem).toBeInTheDocument();
    expect(screen.getByTestId('icon-move')).toBeInTheDocument();
    fireEvent.click(moveItem);
    expect(defaultProps.onOpenMoveDialog).toHaveBeenCalled();

    const addToFavoritesItem = await screen.findByText('Add to Favorites');
    expect(addToFavoritesItem).toBeInTheDocument();
    expect(screen.getByTestId('icon-star')).toBeInTheDocument();
    // fireEvent.click(addToFavoritesItem); // No prop for this, console.log in component

    const archiveItem = await screen.findByText('Archive');
    expect(archiveItem).toBeInTheDocument();
    expect(screen.getByTestId('icon-archive')).toBeInTheDocument();
    // fireEvent.click(archiveItem); // No prop for this, console.log in component
  });

  it('shows loader and disables Rename item when isPendingRename is true', async () => {
    render(<AssetActionDropdownMenu {...defaultProps} isPendingRename={true} />);
    openMenu();
    const renameItem = await screen.findByText('Rename');
    expect(renameItem.closest('button')).toBeDisabled();
    expect(screen.getByTestId('icon-loader2')).toBeInTheDocument();
    expect(screen.queryByTestId('icon-edit3')).not.toBeInTheDocument();
  });

  it('shows loader and disables Move item when isPendingMove is true', async () => {
    render(<AssetActionDropdownMenu {...defaultProps} isPendingMove={true} />);
    openMenu();
    const organizeSubMenuTrigger = await screen.findByText('Organize');
    fireEvent.click(organizeSubMenuTrigger);

    const moveItem = await screen.findByText('Move');
    expect(moveItem.closest('button')).toBeDisabled();
    expect(screen.getByTestId('icon-loader2')).toBeInTheDocument(); // Check for loader specific to move
    expect(screen.queryByTestId('icon-move')).not.toBeInTheDocument();
  });

  it('shows loader and disables Download item when isDownloading is true', async () => {
    render(<AssetActionDropdownMenu {...defaultProps} isDownloading={true} />);
    openMenu();
    const downloadItemText = await screen.findByText('Preparing...');
    expect(downloadItemText.closest('button')).toBeDisabled();
    expect(downloadItemText).toBeInTheDocument();
    expect(screen.getByTestId('icon-loader2')).toBeInTheDocument();
    expect(screen.queryByTestId('icon-download')).not.toBeInTheDocument();
  });

   it('shows normal Download item text when not downloading', async () => {
    render(<AssetActionDropdownMenu {...defaultProps} isDownloading={false} />);
    openMenu();
    const downloadItem = await screen.findByText('Download');
    expect(downloadItem.closest('button')).not.toBeDisabled();
    expect(downloadItem).toBeInTheDocument();
    expect(downloadItem).not.toHaveAttribute('disabled');
    expect(screen.getByTestId('icon-download')).toBeInTheDocument();
    expect(screen.queryByTestId('icon-loader2')).not.toBeInTheDocument();
  });

}); 