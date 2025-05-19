import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { getCellContent } from './AssetListItemCell';
import type { CombinedItem, Asset, Tag, Folder } from '@/types/dam';
import type { damTableColumns as DamTableColumnsType } from './dam-column-config'; 
import type { useAssetItemActions } from './hooks/useAssetItemActions';

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    Folder: () => <div data-testid="folder-icon" />,
    FileText: () => <div data-testid="file-icon" />,
  };
});

// Mock UI components
vi.mock('@/components/ui/badge', () => ({
  Badge: vi.fn(({ children, variant, className }) => (
    <span data-testid="badge" data-variant={variant} className={className}>{children}</span>
  )),
}));

vi.mock('@/components/ui/popover', () => ({
  Popover: vi.fn(({ children }) => <div data-testid="popover">{children}</div>),
  PopoverTrigger: vi.fn(({ children, asChild }) => <div data-testid="popover-trigger">{children}</div>),
  PopoverContent: vi.fn(({ children, className }) => <div data-testid="popover-content" className={className}>{/* Intentionally not rendering children to simplify badge counting */}</div>),
}));

vi.mock('./AssetActionDropdownMenu', () => ({
  AssetActionDropdownMenu: vi.fn((props) => <div data-testid="asset-action-dropdown-menu" {...props} />),
}));

// Import the mocked component to access it directly
import { AssetActionDropdownMenu } from './AssetActionDropdownMenu';

// Sample Data
const mockAsset: Asset = {
  id: 'asset123',
  name: 'Test Asset',
  type: 'asset',
  user_id: 'user1',
  organization_id: 'org1',
  created_at: new Date('2023-01-01T10:00:00Z').toISOString(),
  ownerName: 'John Doe',
  storage_path: '/assets/test-asset.jpg',
  mime_type: 'image/jpeg',
  size: 102400, // 100KB
  folder_id: 'folderABC',
  publicUrl: 'http://example.com/test-asset.jpg',
  parentFolderName: 'Parent Folder A',
  tags: [
    { id: 'tag1', name: 'Photo', user_id: 'user1', created_at: new Date().toISOString(), organization_id: 'org1' }, 
    { id: 'tag2', name: 'Vacation', user_id: 'user1', created_at: new Date().toISOString(), organization_id: 'org1' }
  ],
};

const mockFolder: Folder = {
  id: 'folder456',
  name: 'Test Folder',
  type: 'folder',
  user_id: 'user1',
  organization_id: 'org1',
  created_at: new Date('2023-02-01T11:00:00Z').toISOString(),
  ownerName: 'Jane Smith',
  parent_folder_id: null,
};

const mockAllDamColumns: typeof DamTableColumnsType = [
  { id: 'icon', headerName: '', headerClassName: '', cellClassName: '' },
  { id: 'name', headerName: 'Name', headerClassName: '', cellClassName: '' },
  { id: 'location', headerName: 'Location', isAssetOnly: true, headerClassName: '', cellClassName: '' },
  { id: 'tags', headerName: 'Tags', isAssetOnly: true, headerClassName: '', cellClassName: '' },
  { id: 'owner', headerName: 'Owner', headerClassName: '', cellClassName: '' },
  { id: 'size', headerName: 'Size', isAssetOnly: true, headerClassName: '', cellClassName: '' },
  { id: 'lastModified', headerName: 'Last Modified', headerClassName: '', cellClassName: '' },
  { id: 'actions', headerName: '', headerClassName: '', cellClassName: '' },
];

describe('getCellContent', () => {
  let mockItemActions: ReturnType<typeof useAssetItemActions>;
  let mockOpenDetailsDialog: Mock;
  let mockOpenRenameDialog: Mock;
  let mockOpenMoveDialog: Mock;
  let mockRequestDelete: Mock;

  beforeEach(() => {
    mockOpenDetailsDialog = vi.fn();
    mockOpenRenameDialog = vi.fn();
    mockOpenMoveDialog = vi.fn();
    mockRequestDelete = vi.fn();

    mockItemActions = {
      handleDownload: vi.fn(() => Promise.resolve()),
      isDownloading: false,
      handleRenameSubmit: vi.fn(() => Promise.resolve()),
      isPendingRename: false,
      handleMoveConfirm: vi.fn(() => Promise.resolve()),
      isPendingMove: false,
    };
  });

  const callGetCellContentForItem = (colId: string, item: CombinedItem) => {
    const col = mockAllDamColumns.find(c => c.id === colId)!;
    const isFolder = item.type === 'folder';
    const asset = item.type === 'asset' ? (item as Asset) : null;
    const assetTags = asset?.tags || [];
    const inlineTags = assetTags.slice(0, 1);
    const overflowCount = assetTags.length > 1 ? assetTags.length - 1 : 0;
    const fileSize = asset ? `${(asset.size / 1024).toFixed(1)}KB` : '-';
    const lastModified = item.created_at;

    return getCellContent(
      col,
      item,
      isFolder,
      asset,
      inlineTags,
      overflowCount,
      assetTags,
      fileSize,
      lastModified,
      mockItemActions,
      mockOpenDetailsDialog,
      mockOpenRenameDialog,
      mockOpenMoveDialog,
      mockRequestDelete
    );
  };

  // Initial test to ensure setup is okay
  it('should be defined', () => {
    expect(getCellContent).toBeDefined();
  });

  describe('Column: icon', () => {
    it('should return FolderIcon for a folder', () => {
      const { content, displayColumn } = callGetCellContentForItem('icon', mockFolder);
      render(content as React.ReactElement);
      expect(displayColumn).toBe(true);
      expect(screen.getByTestId('folder-icon')).toBeInTheDocument();
    });

    it('should return FileIcon for an asset', () => {
      const { content, displayColumn } = callGetCellContentForItem('icon', mockAsset);
      render(content as React.ReactElement);
      expect(displayColumn).toBe(true);
      expect(screen.getByTestId('file-icon')).toBeInTheDocument();
    });
  });

  describe('Column: name', () => {
    it('should return the item name for a folder', () => {
      const { content, displayColumn } = callGetCellContentForItem('name', mockFolder);
      render(content as React.ReactElement);
      expect(displayColumn).toBe(true);
      expect(screen.getByText(mockFolder.name)).toBeInTheDocument();
    });

    it('should return the item name for an asset', () => {
      const { content, displayColumn } = callGetCellContentForItem('name', mockAsset);
      render(content as React.ReactElement);
      expect(displayColumn).toBe(true);
      expect(screen.getByText(mockAsset.name)).toBeInTheDocument();
    });
  });

  describe('Column: location', () => {
    const colId = 'location';

    it('should return parentFolderName for an asset if col.isAssetOnly is true', () => {
      const { content, displayColumn } = callGetCellContentForItem(colId, mockAsset);
      render(content as React.ReactElement);
      expect(displayColumn).toBe(true);
      expect(screen.getByText(mockAsset.parentFolderName!)).toBeInTheDocument();
    });

    it('should return an empty div for a folder if col.isAssetOnly is true and column has width styling', () => {
      const colConfigWithWidth = { ...mockAllDamColumns.find(c => c.id === colId)!, cellStyle: { width: '100px' } };
      const { content, displayColumn } = getCellContent(
        colConfigWithWidth,
        mockFolder, true, null, [], 0, [], '-', mockFolder.created_at, mockItemActions, 
        mockOpenDetailsDialog, mockOpenRenameDialog, mockOpenMoveDialog, mockRequestDelete
      );
      render(content as React.ReactElement);
      expect(displayColumn).toBe(true);
      expect((content as React.ReactElement).type).toBe('div'); // Check for empty div
      expect(screen.queryByText('-')).not.toBeInTheDocument();
    });

    it('should return "-" for a folder if col.isAssetOnly is false (simulated)', () => {
      const colConfigNotAssetOnly = { ...mockAllDamColumns.find(c => c.id === colId)!, isAssetOnly: false };
      const { content, displayColumn } = getCellContent(
        colConfigNotAssetOnly,
        mockFolder, true, null, [], 0, [], '-', mockFolder.created_at, mockItemActions, 
        mockOpenDetailsDialog, mockOpenRenameDialog, mockOpenMoveDialog, mockRequestDelete
      );
      render(content as React.ReactElement);
      expect(displayColumn).toBe(true);
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should return displayColumn false for a folder if col.isAssetOnly is true and no width styling', () => {
      const { content, displayColumn } = callGetCellContentForItem(colId, mockFolder);
      expect(displayColumn).toBe(false);
      expect(content).toBeNull();
    });
  });

  describe('Column: tags', () => {
    const colId = 'tags';

    it('should render tags for an asset with inline and popover for overflow', () => {
      const { content, displayColumn } = callGetCellContentForItem(colId, mockAsset); // mockAsset has 2 tags
      render(content as React.ReactElement);
      expect(displayColumn).toBe(true);
      expect(screen.getAllByTestId('badge')).toHaveLength(1 + 1); // 1 inline, 1 for popover trigger
      expect(screen.getByText(mockAsset.tags![0].name)).toBeInTheDocument();
      expect(screen.getByText('+1 more')).toBeInTheDocument();
      // Popover content is not rendered by default by our mock, but trigger should be there
      expect(screen.getByTestId('popover')).toBeInTheDocument();
      expect(screen.getByTestId('popover-trigger')).toBeInTheDocument();
    });

    it('should render only inline tags if no overflow', () => {
      const assetWithOneTag = { ...mockAsset, tags: [mockAsset.tags![0]] };
      const { content, displayColumn } = callGetCellContentForItem(colId, assetWithOneTag);
      render(content as React.ReactElement);
      expect(displayColumn).toBe(true);
      expect(screen.getAllByTestId('badge')).toHaveLength(1);
      expect(screen.getByText(assetWithOneTag.tags![0].name)).toBeInTheDocument();
      expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
      expect(screen.queryByTestId('popover')).not.toBeInTheDocument();
    });

    it('should return an empty div for a folder if col.isAssetOnly is true and column has width styling', () => {
      const colConfigWithWidth = { ...mockAllDamColumns.find(c => c.id === colId)!, cellStyle: { width: '100px' } };
      const { content, displayColumn } = getCellContent(
        colConfigWithWidth,
        mockFolder, true, null, [], 0, [], '-', mockFolder.created_at, mockItemActions, 
        mockOpenDetailsDialog, mockOpenRenameDialog, mockOpenMoveDialog, mockRequestDelete
      );
      render(content as React.ReactElement);
      expect(displayColumn).toBe(true);
      expect((content as React.ReactElement).type).toBe('div');
      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    });

    it('should return "-" for a folder if col.isAssetOnly is false (simulated)', () => {
      const colConfigNotAssetOnly = { ...mockAllDamColumns.find(c => c.id === colId)!, isAssetOnly: false };
      const { content, displayColumn } = getCellContent(
        colConfigNotAssetOnly,
        mockFolder, true, null, [], 0, [], '-', mockFolder.created_at, mockItemActions, 
        mockOpenDetailsDialog, mockOpenRenameDialog, mockOpenMoveDialog, mockRequestDelete
      );
      render(content as React.ReactElement);
      expect(displayColumn).toBe(true);
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should return displayColumn false for a folder if col.isAssetOnly is true and no width styling', () => {
      const { content, displayColumn } = callGetCellContentForItem(colId, mockFolder);
      expect(displayColumn).toBe(false);
      expect(content).toBeNull();
    });
  });

  describe('Column: owner', () => {
    const colId = 'owner';

    it('should return ownerName for an asset', () => {
      const { content, displayColumn } = callGetCellContentForItem(colId, mockAsset);
      render(content as React.ReactElement);
      expect(displayColumn).toBe(true);
      expect(screen.getByText(mockAsset.ownerName!)).toBeInTheDocument();
    });

    it('should return ownerName for a folder', () => {
      const { content, displayColumn } = callGetCellContentForItem(colId, mockFolder);
      render(content as React.ReactElement);
      expect(displayColumn).toBe(true);
      expect(screen.getByText(mockFolder.ownerName!)).toBeInTheDocument();
    });

    it('should return "-" if ownerName is null', () => {
      const assetWithoutOwner = { ...mockAsset, ownerName: null };
      const { content, displayColumn } = callGetCellContentForItem(colId, assetWithoutOwner);
      render(content as React.ReactElement);
      expect(displayColumn).toBe(true);
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('Column: size', () => {
    const colId = 'size';

    it('should return formatted fileSize for an asset if col.isAssetOnly is true', () => {
      const expectedSize = `${(mockAsset.size / 1024).toFixed(1)}KB`;
      const { content, displayColumn } = callGetCellContentForItem(colId, mockAsset);
      render(content as React.ReactElement);
      expect(displayColumn).toBe(true);
      expect(screen.getByText(expectedSize)).toBeInTheDocument();
    });

    it('should return an empty div for a folder if col.isAssetOnly is true and column has width styling', () => {
      const colConfigWithWidth = { ...mockAllDamColumns.find(c => c.id === colId)!, cellStyle: { width: '100px' } };
      const { content, displayColumn } = getCellContent(
        colConfigWithWidth,
        mockFolder, true, null, [], 0, [], '-', mockFolder.created_at, mockItemActions, 
        mockOpenDetailsDialog, mockOpenRenameDialog, mockOpenMoveDialog, mockRequestDelete
      );
      render(content as React.ReactElement);
      expect(displayColumn).toBe(true);
      expect((content as React.ReactElement).type).toBe('div');
      expect(screen.queryByText(`${(mockAsset.size / 1024).toFixed(1)}KB`)).not.toBeInTheDocument();
    });

    it('should return "-" for a folder if col.isAssetOnly is false (simulated)', () => {
      const colConfigNotAssetOnly = { ...mockAllDamColumns.find(c => c.id === colId)!, isAssetOnly: false };
      const { content, displayColumn } = getCellContent(
        colConfigNotAssetOnly,
        mockFolder, true, null, [], 0, [], '-', mockFolder.created_at, mockItemActions, 
        mockOpenDetailsDialog, mockOpenRenameDialog, mockOpenMoveDialog, mockRequestDelete
      );
      render(content as React.ReactElement);
      expect(displayColumn).toBe(true);
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should return displayColumn false for a folder if col.isAssetOnly is true and no width styling', () => {
      const { content, displayColumn } = callGetCellContentForItem(colId, mockFolder);
      expect(displayColumn).toBe(false);
      expect(content).toBeNull();
    });
  });

  describe('Column: lastModified', () => {
    const colId = 'lastModified';

    it('should return formatted date and time for an asset', () => {
      const { content, displayColumn } = callGetCellContentForItem(colId, mockAsset);
      const expectedDate = new Date(mockAsset.created_at).toLocaleDateString();
      const expectedTime = new Date(mockAsset.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      render(content as React.ReactElement);
      expect(displayColumn).toBe(true);
      expect(screen.getByText(`${expectedDate} ${expectedTime}`)).toBeInTheDocument();
    });

    it('should return formatted date and time for a folder', () => {
      const { content, displayColumn } = callGetCellContentForItem(colId, mockFolder);
      const expectedDate = new Date(mockFolder.created_at).toLocaleDateString();
      const expectedTime = new Date(mockFolder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      render(content as React.ReactElement);
      expect(displayColumn).toBe(true);
      expect(screen.getByText(`${expectedDate} ${expectedTime}`)).toBeInTheDocument();
    });
  });

  describe('Column: actions', () => {
    const colId = 'actions';

    it('should render AssetActionDropdownMenu for an asset if itemActions are provided', () => {
      const { content, displayColumn } = callGetCellContentForItem(colId, mockAsset);
      render(content as React.ReactElement);
      expect(displayColumn).toBe(true);
      
      expect(screen.getByTestId('asset-action-dropdown-menu')).toBeInTheDocument();
      
      // Check props passed to the mock component
      const mockComponent = vi.mocked(AssetActionDropdownMenu); // Use the imported mock
      expect(mockComponent.mock.calls.length).toBeGreaterThan(0);
      const lastCallProps = mockComponent.mock.calls[mockComponent.mock.calls.length - 1][0];
      expect(lastCallProps.item).toEqual(mockAsset); 
      expect(lastCallProps.onDelete).toBe(mockRequestDelete);
      expect(lastCallProps.isDownloading).toBe(mockItemActions.isDownloading);
    });

    it('should not render AssetActionDropdownMenu for an asset if itemActions is null', () => {
      const { content, displayColumn } = getCellContent(
        mockAllDamColumns.find(c => c.id === colId)!,
        mockAsset, false, mockAsset, [], 0, [], '100KB', mockAsset.created_at, 
        null, // itemActions is null
        mockOpenDetailsDialog, mockOpenRenameDialog, mockOpenMoveDialog, mockRequestDelete
      );
      // Check if it falls into the 'else' with width styling (default mock column has no specific width style for actions)
      // To ensure it tries to render a div instead of displayColumn=false, let's add a style
      const colConfigWithWidth = { ...mockAllDamColumns.find(c => c.id === colId)!, cellStyle: { width: '20px' } };
      const { content: contentWithStyle, displayColumn: displayColumnWithStyle } = getCellContent(
        colConfigWithWidth,
        mockAsset, false, mockAsset, [], 0, [], '100KB', mockAsset.created_at, 
        null, mockOpenDetailsDialog, mockOpenRenameDialog, mockOpenMoveDialog, mockRequestDelete
      );
      render(contentWithStyle as React.ReactElement);
      expect(displayColumnWithStyle).toBe(true);
      expect(screen.queryByTestId('asset-action-dropdown-menu')).not.toBeInTheDocument();
      const propsLine399 = (contentWithStyle as React.ReactElement).props as { className: string };
      expect(propsLine399.className).toContain('h-full w-full'); // placeholder div
    });

    it('should return displayColumn false for a folder (no actions for folders)', () => {
      const { content, displayColumn } = callGetCellContentForItem(colId, mockFolder);
       // If column has width styling, it will render an empty div
      const colConfigWithWidth = { ...mockAllDamColumns.find(c => c.id === colId)!, cellStyle: { width: '20px' } };
      const { content: contentWithStyle, displayColumn: displayColumnWithStyle } = getCellContent(
        colConfigWithWidth,
        mockFolder, true, null, [], 0, [], '-', mockFolder.created_at, mockItemActions, 
        mockOpenDetailsDialog, mockOpenRenameDialog, mockOpenMoveDialog, mockRequestDelete
      );
      render(contentWithStyle as React.ReactElement);
      expect(displayColumnWithStyle).toBe(true);
      expect(screen.queryByTestId('asset-action-dropdown-menu')).not.toBeInTheDocument();
      const propsLine414 = (contentWithStyle as React.ReactElement).props as { className: string };
      expect(propsLine414.className).toContain('h-full w-full'); // placeholder div
    });

    it('should return displayColumn false if no itemActions and no width styling for asset', () => {
      const colConfigNoWidth = { ...mockAllDamColumns.find(c => c.id === colId)!, cellStyle: undefined, cellClassName: '' };
      const { content, displayColumn } = getCellContent(
        colConfigNoWidth,
        mockAsset, false, mockAsset, [], 0, [], '100KB', mockAsset.created_at, 
        null, mockOpenDetailsDialog, mockOpenRenameDialog, mockOpenMoveDialog, mockRequestDelete
      );
      expect(displayColumn).toBe(false);
      expect(content).toBeNull();
    });
  });

  describe('Default case', () => {
    it('should return displayColumn false for an unknown column id', () => {
      const unknownCol: Partial<typeof mockAllDamColumns[0]> = { 
        id: 'unknown', 
        headerName: 'Unknown', 
        isAssetOnly: undefined, 
        cellStyle: undefined, 
        cellClassName: undefined 
      };
      const { content, displayColumn } = getCellContent(
        unknownCol as typeof mockAllDamColumns[0], // Cast to the full type for the function
        mockAsset, false, mockAsset, [], 0, [], '100KB', mockAsset.created_at, mockItemActions,
        mockOpenDetailsDialog, mockOpenRenameDialog, mockOpenMoveDialog, mockRequestDelete
      );
      expect(displayColumn).toBe(false);
      expect(content).toBeNull();
    });
  });

}); 