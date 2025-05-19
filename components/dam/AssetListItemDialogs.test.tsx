import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { AssetListItemDialogs } from './AssetListItemDialogs';
import type { Asset } from '@/types/dam';
import type { UseAssetItemDialogsReturn } from './hooks/useAssetItemDialogs';
import type { UseAssetItemActionsReturn } from './hooks/useAssetItemActions';

// Mock child components
vi.mock('@/components/dam/dialogs/InputDialog', () => ({
  InputDialog: vi.fn(({ isOpen, onOpenChange, title, description, initialValue, inputLabel, onSubmit, isLoading }) => 
    isOpen ? (
      <div data-testid="input-dialog">
        <h1>{title}</h1>
        <p>{description}</p>
        <input defaultValue={initialValue} aria-label={inputLabel} />
        <button onClick={() => onSubmit('new value')}>Submit</button>
        <button onClick={() => onOpenChange(false)}>Close</button>
        {isLoading && <p>Loading...</p>}
      </div>
    ) : null
  ),
}));

vi.mock('@/components/dam/dialogs/AssetDetailsDialog', () => ({
  AssetDetailsDialog: vi.fn(({ isOpen, onOpenChange, asset, onAssetDataChange }) =>
    isOpen ? (
      <div data-testid="asset-details-dialog">
        <p>Asset: {asset.name}</p>
        <button onClick={() => onAssetDataChange()}>Data Change</button>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null
  ),
}));

vi.mock('@/components/dam/dialogs/FolderPickerDialog', () => ({
  FolderPickerDialog: vi.fn(({ isOpen, onOpenChange, onFolderSelect, currentAssetFolderId, assetName }) =>
    isOpen ? (
      <div data-testid="folder-picker-dialog">
        <p>Asset: {assetName}</p>
        <p>Current Folder: {currentAssetFolderId}</p>
        <button onClick={() => onFolderSelect('new-folder-id')}>Select Folder</button>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null
  ),
}));

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: vi.fn(({ open, onOpenChange, children }) => open ? <div data-testid="alert-dialog-main" onClick={() => onOpenChange(!open)}>{children}</div> : null),
  AlertDialogAction: vi.fn(({ onClick, disabled, children, ...props }) => <button data-testid="alert-dialog-action" onClick={onClick} disabled={disabled} {...props}>{children}</button>),
  AlertDialogCancel: vi.fn(({ disabled, children, ...props }) => <button data-testid="alert-dialog-cancel" disabled={disabled} {...props}>{children}</button>),
  AlertDialogContent: vi.fn(({ children }) => <div data-testid="alert-dialog-content">{children}</div>),
  AlertDialogDescription: vi.fn(({ children }) => <p data-testid="alert-dialog-description">{children}</p>),
  AlertDialogFooter: vi.fn(({ children }) => <div data-testid="alert-dialog-footer">{children}</div>),
  AlertDialogHeader: vi.fn(({ children }) => <div data-testid="alert-dialog-header">{children}</div>),
  AlertDialogTitle: vi.fn(({ children }) => <h2 data-testid="alert-dialog-title">{children}</h2>),
}));

const mockAsset: Asset = {
  id: 'asset1',
  name: 'Test Asset',
  mime_type: 'image/jpeg',
  size: 102400,
  created_at: new Date().toISOString(),
  user_id: 'user1',
  organization_id: 'org1',
  folder_id: 'folderABC',
  storage_path: '/asset1.jpg',
  type: 'asset',
  publicUrl: 'http://example.com/asset1.jpg',
  ownerName: 'Owner',
  parentFolderName: null,
  tags: [],
};

describe('AssetListItemDialogs', () => {
  let mockCloseRenameDialog: Mock;
  let mockCloseDetailsDialog: Mock;
  let mockCloseMoveDialog: Mock;
  let mockSetIsDeleteDialogOpen: Mock;
  let mockHandleConfirmDelete: Mock;
  let mockOnDataChange: Mock;
  let mockItemActions: UseAssetItemActionsReturn;
  let defaultProps: any;

  beforeEach(() => {
    mockCloseRenameDialog = vi.fn();
    mockCloseDetailsDialog = vi.fn();
    mockCloseMoveDialog = vi.fn();
    mockSetIsDeleteDialogOpen = vi.fn();
    mockHandleConfirmDelete = vi.fn();
    mockOnDataChange = vi.fn(() => Promise.resolve());

    mockItemActions = {
      handleRenameSubmit: vi.fn(() => Promise.resolve()),
      isPendingRename: false,
      handleMoveConfirm: vi.fn(() => Promise.resolve()),
      isPendingMove: false,
      handleDownload: vi.fn(() => Promise.resolve()),
      isDownloading: false,
    };

    defaultProps = {
      asset: mockAsset,
      renameDialog: { isOpen: false, data: null },
      closeRenameDialog: mockCloseRenameDialog,
      detailsDialog: { isOpen: false, data: null },
      closeDetailsDialog: mockCloseDetailsDialog,
      moveDialog: { isOpen: false, data: null },
      closeMoveDialog: mockCloseMoveDialog,
      itemActions: mockItemActions,
      isDeleteDialogOpen: false,
      setIsDeleteDialogOpen: mockSetIsDeleteDialogOpen,
      handleConfirmDelete: mockHandleConfirmDelete,
      isDeleting: false,
      onDataChange: mockOnDataChange,
    };
  });

  it('renders nothing if asset is null', () => {
    render(<AssetListItemDialogs {...defaultProps} asset={null} />);
    expect(screen.queryByTestId('input-dialog')).not.toBeInTheDocument();
    expect(screen.queryByTestId('asset-details-dialog')).not.toBeInTheDocument();
    expect(screen.queryByTestId('folder-picker-dialog')).not.toBeInTheDocument();
    expect(screen.queryByTestId('alert-dialog-main')).not.toBeInTheDocument();
  });

  it('renders nothing if itemActions is null', () => {
    render(<AssetListItemDialogs {...defaultProps} itemActions={null} />);
    expect(screen.queryByTestId('input-dialog')).not.toBeInTheDocument();
  });

  describe('Rename Dialog (InputDialog)', () => {
    it('renders InputDialog when renameDialog.isOpen is true and data is present', () => {
      render(<AssetListItemDialogs {...defaultProps} renameDialog={{ isOpen: true, data: mockAsset }} />);
      expect(screen.getByTestId('input-dialog')).toBeInTheDocument();
      expect(screen.getByText(`Rename Asset`)).toBeInTheDocument();
      expect(screen.getByText(`Renaming "${mockAsset.name}". Enter a new name below.`)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockAsset.name)).toBeInTheDocument();
    });

    it('calls closeRenameDialog when InputDialog onOpenChange is called with false', () => {
      render(<AssetListItemDialogs {...defaultProps} renameDialog={{ isOpen: true, data: mockAsset }} />);
      fireEvent.click(screen.getByRole('button', { name: 'Close' })); // Mocked InputDialog's close button
      expect(mockCloseRenameDialog).toHaveBeenCalledTimes(1);
    });

    it('calls itemActions.handleRenameSubmit on InputDialog submit', async () => {
      render(<AssetListItemDialogs {...defaultProps} renameDialog={{ isOpen: true, data: mockAsset }} />);
      fireEvent.click(screen.getByRole('button', { name: 'Submit' })); // Mocked InputDialog's submit button
      expect(defaultProps.itemActions.handleRenameSubmit).toHaveBeenCalledWith('new value');
    });

    it('passes isPendingRename to InputDialog isLoading prop', () => {
      const itemActionsWithPendingRename = { ...mockItemActions, isPendingRename: true };
      render(<AssetListItemDialogs {...defaultProps} itemActions={itemActionsWithPendingRename} renameDialog={{ isOpen: true, data: mockAsset }} />);
      expect(screen.getByTestId('input-dialog')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument(); // Mocked InputDialog shows this when isLoading
    });
  });

  describe('Asset Details Dialog (AssetDetailsDialog)', () => {
    it('renders AssetDetailsDialog when detailsDialog.isOpen is true and data is present', () => {
      render(<AssetListItemDialogs {...defaultProps} detailsDialog={{ isOpen: true, data: mockAsset }} />);
      expect(screen.getByTestId('asset-details-dialog')).toBeInTheDocument();
      expect(screen.getByText(`Asset: ${mockAsset.name}`)).toBeInTheDocument(); // From mock
    });

    it('calls closeDetailsDialog when AssetDetailsDialog onOpenChange is called with false', () => {
      render(<AssetListItemDialogs {...defaultProps} detailsDialog={{ isOpen: true, data: mockAsset }} />);
      fireEvent.click(screen.getByRole('button', { name: 'Close' })); // Mocked AssetDetailsDialog's close button
      expect(mockCloseDetailsDialog).toHaveBeenCalledTimes(1);
    });

    it('calls onDataChange when AssetDetailsDialog onAssetDataChange is called', () => {
      render(<AssetListItemDialogs {...defaultProps} detailsDialog={{ isOpen: true, data: mockAsset }} />);
      fireEvent.click(screen.getByRole('button', { name: 'Data Change' })); // Mocked AssetDetailsDialog's data change button
      expect(mockOnDataChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Move Dialog (FolderPickerDialog)', () => {
    it('renders FolderPickerDialog when moveDialog.isOpen is true and data is present', () => {
      render(<AssetListItemDialogs {...defaultProps} moveDialog={{ isOpen: true, data: mockAsset }} />);
      expect(screen.getByTestId('folder-picker-dialog')).toBeInTheDocument();
      expect(screen.getByText(`Asset: ${mockAsset.name}`)).toBeInTheDocument(); // From mock
      expect(screen.getByText(`Current Folder: ${mockAsset.folder_id}`)).toBeInTheDocument(); // From mock
    });

    it('calls closeMoveDialog when FolderPickerDialog onOpenChange is called with false', () => {
      render(<AssetListItemDialogs {...defaultProps} moveDialog={{ isOpen: true, data: mockAsset }} />);
      fireEvent.click(screen.getByRole('button', { name: 'Close' })); // Mocked FolderPickerDialog's close button
      expect(mockCloseMoveDialog).toHaveBeenCalledTimes(1);
    });

    it('calls itemActions.handleMoveConfirm on FolderPickerDialog onFolderSelect', () => {
      render(<AssetListItemDialogs {...defaultProps} moveDialog={{ isOpen: true, data: mockAsset }} />);
      fireEvent.click(screen.getByRole('button', { name: 'Select Folder' })); // Mocked FolderPickerDialog's select button
      expect(defaultProps.itemActions.handleMoveConfirm).toHaveBeenCalledWith('new-folder-id');
    });
  });

  describe('Delete Confirmation Dialog (AlertDialog)', () => {
    it('renders AlertDialog when isDeleteDialogOpen is true', () => {
      render(<AssetListItemDialogs {...defaultProps} isDeleteDialogOpen={true} />);
      expect(screen.getByTestId('alert-dialog-main')).toBeInTheDocument();
      expect(screen.getByTestId('alert-dialog-title')).toHaveTextContent('Are you sure you want to delete this asset?');
      expect(screen.getByTestId('alert-dialog-description')).toHaveTextContent(`You are about to delete "${mockAsset.name}". This action cannot be undone.`);
      expect(screen.getByTestId('alert-dialog-cancel')).toBeInTheDocument();
      expect(screen.getByTestId('alert-dialog-action')).toBeInTheDocument();
    });

    it('calls setIsDeleteDialogOpen when AlertDialog onOpenChange is triggered (e.g. clicking overlay)', () => {
      render(<AssetListItemDialogs {...defaultProps} isDeleteDialogOpen={true} />);
      // Our mock for AlertDialog calls onOpenChange with !open when its main div is clicked
      fireEvent.click(screen.getByTestId('alert-dialog-main')); 
      expect(mockSetIsDeleteDialogOpen).toHaveBeenCalledWith(false);
    });

    it('calls handleConfirmDelete when AlertDialogAction is clicked', () => {
      render(<AssetListItemDialogs {...defaultProps} isDeleteDialogOpen={true} />);
      fireEvent.click(screen.getByTestId('alert-dialog-action'));
      expect(mockHandleConfirmDelete).toHaveBeenCalledTimes(1);
    });

    it('disables AlertDialogCancel and AlertDialogAction when isDeleting is true', () => {
      render(<AssetListItemDialogs {...defaultProps} isDeleteDialogOpen={true} isDeleting={true} />);
      expect(screen.getByTestId('alert-dialog-cancel')).toBeDisabled();
      expect(screen.getByTestId('alert-dialog-action')).toBeDisabled();
      expect(screen.getByTestId('alert-dialog-action')).toHaveTextContent('Deleting...');
    });

    it('shows default text on AlertDialogAction when not deleting', () => {
      render(<AssetListItemDialogs {...defaultProps} isDeleteDialogOpen={true} isDeleting={false} />);
      expect(screen.getByTestId('alert-dialog-action')).toHaveTextContent('Delete');
      expect(screen.getByTestId('alert-dialog-cancel')).not.toBeDisabled();
      expect(screen.getByTestId('alert-dialog-action')).not.toBeDisabled();
    });
  });

}); 