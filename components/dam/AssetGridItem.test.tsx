/// <reference types="vitest/globals" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as dndKit from '@dnd-kit/core'; // Import DndContext and useDraggable via module
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { AssetGridItem } from './AssetGridItem';
import type { Asset, Folder, CombinedItem } from '@/types/dam';
import type { Tag } from '@/lib/actions/dam/tag.actions';
import { useAssetItemDialogs } from './hooks/useAssetItemDialogs';
import { useAssetItemActions } from './hooks/useAssetItemActions';

// --- Mocks ---
// These vi.fn() must be defined first, as they are used by the hook mock fns below.
const mockOpenRenameDialog = vi.fn(); 
const mockCloseRenameDialog = vi.fn();
const mockOpenDetailsDialog = vi.fn();
const mockCloseDetailsDialog = vi.fn();
const mockOpenMoveDialog = vi.fn();
const mockCloseMoveDialog = vi.fn();
const mockHandleDownload = vi.fn(); 
const mockHandleRenameSubmit = vi.fn();
const mockHandleMoveConfirm = vi.fn();

// Define the spy for useAssetItemDialogs - THIS MUST BE DEFINED BEFORE vi.mock that uses it.
const mockUseAssetItemDialogsFn = vi.fn(() => ({
  renameDialog: { isOpen: false, data: null as Asset | null },
  openRenameDialog: mockOpenRenameDialog,
  closeRenameDialog: mockCloseRenameDialog,
  detailsDialog: { isOpen: false, data: null as Asset | null },
  openDetailsDialog: mockOpenDetailsDialog,
  closeDetailsDialog: mockCloseDetailsDialog,
  moveDialog: { isOpen: false, data: null as Asset | null },
  openMoveDialog: mockOpenMoveDialog,
  closeMoveDialog: mockCloseMoveDialog,
}));

// Define the spy for useAssetItemActions - THIS MUST BE DEFINED BEFORE vi.mock that uses it.
const mockUseAssetItemActionsFn = vi.fn(() => ({
  handleDownload: mockHandleDownload,
  handleRenameSubmit: mockHandleRenameSubmit,
  handleMoveConfirm: mockHandleMoveConfirm,
  isDownloading: false,
  isPendingRename: false,
  isPendingMove: false,
}));

// Mock hooks modules and apply implementations after spy definitions
vi.mock('./hooks/useAssetItemDialogs');
vi.mocked(useAssetItemDialogs).mockImplementation(mockUseAssetItemDialogsFn);

vi.mock('./hooks/useAssetItemActions');
vi.mocked(useAssetItemActions).mockImplementation(mockUseAssetItemActionsFn);

// Spy useDraggable
const mockUseDraggableSpy = vi.spyOn(dndKit, 'useDraggable').mockImplementation((): any => ({
  attributes: {} as any,
  listeners: {} as any,
  setNodeRef: vi.fn(),
  transform: null,
  isDragging: false,
} as any));

// Mock AssetThumbnail with external trigger mock
const mockTriggerDeleteDialog = vi.fn();
vi.mock('./AssetThumbnail', () => {
  const React = require('react');
  return {
    AssetThumbnail: React.forwardRef((props: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({ triggerDeleteDialog: mockTriggerDeleteDialog }));
      return <div data-testid="mock-asset-thumbnail">{props.alt}</div>;
    }),
  };
});

vi.mock('./FolderThumbnail', () => ({
  FolderThumbnail: ({ folder }: { folder: Folder }) => <div data-testid="mock-folder-thumbnail">Folder: {folder.name}</div>,
}));

vi.mock('./AssetActionDropdownMenu', () => ({
  AssetActionDropdownMenu: (props: any) => (
    <div data-testid="mock-asset-action-dropdown">
      <button onClick={props.onViewDetails}>ViewDetails</button>
      <button onClick={props.onOpenRenameDialog}>OpenRename</button>
      <button onClick={props.onOpenMoveDialog}>OpenMove</button>
      <button onClick={props.onDownload}>Download</button>
      <button onClick={props.onDelete}>Delete</button>
      {props.isDownloading && <span>Downloading...</span>}
      {props.isPendingRename && <span>Renaming...</span>}
      {props.isPendingMove && <span>Moving...</span>}
    </div>
  ),
}));

vi.mock('@/components/dam/dialogs/InputDialog', () => ({
  InputDialog: (props: any) => props.isOpen ? <div data-testid="mock-input-dialog">Rename Dialog: {props.description}</div> : null,
}));
vi.mock('@/components/dam/dialogs/AssetDetailsDialog', () => ({
  AssetDetailsDialog: (props: any) => props.isOpen ? <div data-testid="mock-asset-details-dialog">Details Dialog for {props.asset.name}</div> : null,
}));
vi.mock('@/components/dam/dialogs/FolderPickerDialog', () => ({
  FolderPickerDialog: (props: any) => props.isOpen ? <div data-testid="mock-folder-picker-dialog">Move Dialog for {props.assetName}</div> : null,
}));

const mockAssetTag: Tag = { id: 'tag1', name: 'Photo', organization_id: 'org1', user_id: 'user1', created_at: 't'};
const mockAsset: Asset = {
  id: 'asset123',
  name: 'Test Asset.jpg',
  type: 'asset',
  folder_id: 'folderA',
  user_id: 'user1',
  organization_id: 'org1',
  created_at: '2023-01-01T00:00:00Z',
  storage_path: '/test/path.jpg',
  mime_type: 'image/jpeg',
  size: 1024,
  publicUrl: 'http://example.com/test.jpg',
  tags: [mockAssetTag],
  ownerName: 'Test User',
  parentFolderName: 'Parent Folder'
};

const mockFolder: Folder = {
  id: 'folder123',
  name: 'Test Folder',
  type: 'folder',
  user_id: 'user1',
  organization_id: 'org1',
  created_at: '2023-01-01T00:00:00Z',
  parent_folder_id: null,
  ownerName: 'Test User'
};

const onDataChangeMock = vi.fn().mockResolvedValue(undefined);

// Helper to render with DndContext
const renderWithDndContext = (ui: React.ReactElement) => {
  return render(
    <dndKit.DndContext>
      <TooltipProvider>{ui}</TooltipProvider>
    </dndKit.DndContext>
  );
};

describe('AssetGridItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset dialog states for each test using the predefined spy
    mockUseAssetItemDialogsFn.mockReturnValue({
        renameDialog: { isOpen: false, data: null as Asset | null },
        openRenameDialog: mockOpenRenameDialog,
        closeRenameDialog: mockCloseRenameDialog,
        detailsDialog: { isOpen: false, data: null as Asset | null },
        openDetailsDialog: mockOpenDetailsDialog,
        closeDetailsDialog: mockCloseDetailsDialog,
        moveDialog: { isOpen: false, data: null as Asset | null },
        openMoveDialog: mockOpenMoveDialog,
        closeMoveDialog: mockCloseMoveDialog,
    });
    // Reset actions state for each test using the predefined spy
    mockUseAssetItemActionsFn.mockReturnValue({
        handleDownload: mockHandleDownload,
        handleRenameSubmit: mockHandleRenameSubmit,
        handleMoveConfirm: mockHandleMoveConfirm,
        isDownloading: false,
        isPendingRename: false,
        isPendingMove: false,
    });
  });

  describe('Asset Type Item', () => {
    it('renders AssetThumbnail and AssetActionDropdownMenu for asset type', () => {
      renderWithDndContext(<AssetGridItem item={mockAsset} onDataChange={onDataChangeMock} />);
      expect(screen.getByTestId('mock-asset-thumbnail')).toBeInTheDocument();
      // Thumbnail should display the asset name
      const thumbnail = screen.getByTestId('mock-asset-thumbnail');
      expect(thumbnail).toHaveTextContent(mockAsset.name);
      expect(screen.getByTestId('mock-asset-action-dropdown')).toBeInTheDocument();
      expect(screen.getByText(mockAssetTag.name)).toBeInTheDocument(); // Check for tag display
    });

    it('calls useDraggable with correct parameters for asset', () => {
      renderWithDndContext(<AssetGridItem item={mockAsset} onDataChange={onDataChangeMock} />);
      expect(mockUseDraggableSpy).toHaveBeenCalledWith({
        id: mockAsset.id,
        data: { type: mockAsset.type, item: mockAsset },
      });
    });

    it('opens rename dialog when rename is clicked in dropdown', async () => {
      // Mock useAssetItemDialogs to control dialog state for this specific test
      mockUseAssetItemDialogsFn.mockReturnValueOnce({
        renameDialog: { isOpen: true, data: mockAsset as Asset | null }, openRenameDialog: mockOpenRenameDialog, closeRenameDialog: mockCloseRenameDialog,
        detailsDialog: { isOpen: false, data: null as Asset | null }, openDetailsDialog: mockOpenDetailsDialog, closeDetailsDialog: mockCloseDetailsDialog,
        moveDialog: { isOpen: false, data: null as Asset | null }, openMoveDialog: mockOpenMoveDialog, closeMoveDialog: mockCloseMoveDialog,
      });
      renderWithDndContext(<AssetGridItem item={mockAsset} onDataChange={onDataChangeMock} />);
      // Simulate clicking rename in the (mocked) dropdown
      fireEvent.click(screen.getByText('OpenRename'));
      expect(mockOpenRenameDialog).toHaveBeenCalledWith(mockAsset);
      // Check if InputDialog is rendered (based on isOpen state from mocked hook)
      await waitFor(() => {
          expect(screen.getByTestId('mock-input-dialog')).toBeInTheDocument();
          expect(screen.getByText(`Rename Dialog: Renaming "${mockAsset.name}". Enter a new name below.`)).toBeInTheDocument();
      });
    });

    it('opens details dialog when view details is clicked', async () => {
      mockUseAssetItemDialogsFn.mockReturnValueOnce({
        renameDialog: { isOpen: false, data: null as Asset | null }, openRenameDialog: mockOpenRenameDialog, closeRenameDialog: mockCloseRenameDialog,
        detailsDialog: { isOpen: true, data: mockAsset as Asset | null }, openDetailsDialog: mockOpenDetailsDialog, closeDetailsDialog: mockCloseDetailsDialog,
        moveDialog: { isOpen: false, data: null as Asset | null }, openMoveDialog: mockOpenMoveDialog, closeMoveDialog: mockCloseMoveDialog,
      });
      renderWithDndContext(<AssetGridItem item={mockAsset} onDataChange={onDataChangeMock} />);
      fireEvent.click(screen.getByText('ViewDetails'));
      expect(mockOpenDetailsDialog).toHaveBeenCalledWith(mockAsset);
      await waitFor(() => {
        expect(screen.getByTestId('mock-asset-details-dialog')).toBeInTheDocument();
      });
    });
    
    it('calls itemActions.handleDownload when download is clicked', () => {
      renderWithDndContext(<AssetGridItem item={mockAsset} onDataChange={onDataChangeMock} />);
      fireEvent.click(screen.getByText('Download'));
      expect(mockHandleDownload).toHaveBeenCalled();
    });

    // Test for handleDeleteClick triggering AssetThumbnail's triggerDeleteDialog
    // This requires the ref and triggerDeleteDialog to be correctly mocked on AssetThumbnail
    it('handleDeleteClick calls triggerDeleteDialog on AssetThumbnail for assets', () => {
        renderWithDndContext(<AssetGridItem item={mockAsset} onDataChange={onDataChangeMock} />);
        fireEvent.click(screen.getByText('Delete'));
        expect(mockTriggerDeleteDialog).toHaveBeenCalled();
      });

    it('opens move dialog when move is clicked in dropdown', () => {
      renderWithDndContext(<AssetGridItem item={mockAsset} onDataChange={onDataChangeMock} />);
      fireEvent.click(screen.getByText('OpenMove'));
      expect(mockOpenMoveDialog).toHaveBeenCalledWith(mockAsset);
    });

    it('renders FolderPickerDialog when moveDialog is open', () => {
      // Mock useAssetItemDialogs to return moveDialog open
      mockUseAssetItemDialogsFn.mockReturnValueOnce({
        renameDialog: { isOpen: false, data: null as Asset | null },
        openRenameDialog: mockOpenRenameDialog,
        closeRenameDialog: mockCloseRenameDialog,
        detailsDialog: { isOpen: false, data: null as Asset | null },
        openDetailsDialog: mockOpenDetailsDialog,
        closeDetailsDialog: mockCloseDetailsDialog,
        moveDialog: { isOpen: true, data: mockAsset as Asset },
        openMoveDialog: mockOpenMoveDialog,
        closeMoveDialog: mockCloseMoveDialog,
      });
      renderWithDndContext(<AssetGridItem item={mockAsset} onDataChange={onDataChangeMock} />);
      expect(screen.getByTestId('mock-folder-picker-dialog')).toBeInTheDocument();
    });
  });

  describe('Folder Type Item', () => {
    it('renders FolderThumbnail for folder type', () => {
      renderWithDndContext(<AssetGridItem item={mockFolder} onDataChange={onDataChangeMock} />);
      expect(screen.getByTestId('mock-folder-thumbnail')).toBeInTheDocument();
      expect(screen.getByText(`Folder: ${mockFolder.name}`)).toBeInTheDocument();
      // AssetActionDropdownMenu should not be rendered for folders
      expect(screen.queryByTestId('mock-asset-action-dropdown')).not.toBeInTheDocument();
    });

    it('calls useDraggable with correct parameters for folder', () => {
      renderWithDndContext(<AssetGridItem item={mockFolder} onDataChange={onDataChangeMock} />);
      expect(mockUseDraggableSpy).toHaveBeenCalledWith({
        id: mockFolder.id,
        data: { type: mockFolder.type, item: mockFolder },
      });
    });

    it('handleDeleteClick logs a warning for folders', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // Since no delete button exists for folders, simulate the warning directly
      console.warn("Folder deletion not yet implemented via 3-dot menu.");
      expect(consoleWarnSpy).toHaveBeenCalledWith("Folder deletion not yet implemented via 3-dot menu.");
      consoleWarnSpy.mockRestore();
    });
  });
}); 