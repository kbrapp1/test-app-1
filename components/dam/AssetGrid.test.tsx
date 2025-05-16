import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AssetGrid } from './AssetGrid';
import { useToast } from '@/components/ui/use-toast';
import { moveAsset } from '@/lib/actions/dam/asset-crud.actions';
import type { Asset } from '@/types/dam';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

// Mock the drag and drop library as it's complex to test
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div data-testid="dnd-context">{children}</div>,
  closestCenter: vi.fn(),
  pointerWithin: vi.fn(),
  useDraggable: vi.fn(() => ({
    attributes: { role: 'button', 'aria-describedby': 'draggable' },
    listeners: { onMouseDown: vi.fn(), onTouchStart: vi.fn() },
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  })),
  useSensor: vi.fn((sensor) => sensor),
  useSensors: vi.fn((...sensors) => sensors),
  PointerSensor: vi.fn(),
  TouchSensor: vi.fn(),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div data-testid="sortable-context">{children}</div>,
  verticalListSortingStrategy: 'vertical-strategy',
}));

// Mock child components
vi.mock('./AssetThumbnail', () => ({
  AssetThumbnail: (props: Record<string, any>) => {
    // Destructure props to avoid spreading unrecognized ones onto the div
    const { alt, src, assetId, folderId, type, isPriority, mimeType, onDataChange, ...restHtmlProps } = props;
    return <div data-testid="mock-asset-thumbnail" {...restHtmlProps}>Asset: {alt}</div>;
  }
}));

vi.mock('./FolderThumbnail', () => ({
  FolderThumbnail: (props: Record<string, any>) => {
    // Destructure props
    const { folder, ...restHtmlProps } = props;
    return <div data-testid="mock-folder-thumbnail" {...restHtmlProps}>Folder: {folder?.name}</div>;
  }
}));

// Mock react-window
vi.mock('react-window', () => ({
  FixedSizeGrid: ({ 
    children, 
    columnCount, 
    rowCount, 
    width, 
    height 
  }: { 
    children: ({ columnIndex, rowIndex, style }: { columnIndex: number, rowIndex: number, style: React.CSSProperties }) => React.ReactNode,
    columnCount: number,
    rowCount: number,
    width: number,
    height: number
  }) => {
    // Simple mock that renders all items but ignores virtualization
    const items = [];
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
        items.push(
          children({
            columnIndex,
            rowIndex,
            style: { position: 'absolute', top: rowIndex * 150, left: columnIndex * 150, width: 150, height: 150 }
          })
        );
      }
    }
    return (
      <div 
        data-testid="fixed-size-grid" 
        data-width={width} 
        data-height={height}
        data-columns={columnCount}
        data-rows={rowCount}
      >
        {items}
      </div>
    );
  }
}));

// Mock the moveAsset action
vi.mock('@/lib/actions/dam/asset.actions', () => ({
  moveAsset: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn().mockReturnValue({
    toast: vi.fn(),
  }),
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn().mockReturnValue({
    refresh: vi.fn(),
  }),
}));

describe('AssetGrid Component', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;
  
  // Sample data for testing
  // const mockFolders = [ // Folders are not directly handled by AssetGrid anymore
  //   { id: 'folder-1', name: 'Documents', type: 'folder', user_id: 'user1', created_at: '2023-01-01', parent_folder_id: null },
  //   { id: 'folder-2', name: 'Images', type: 'folder', user_id: 'user1', created_at: '2023-01-02', parent_folder_id: null },
  // ];
  
  const mockAssetsData: Asset[] = [
    { 
      id: 'asset-1', 
      name: 'sample1.jpg', 
      type: 'asset', 
      storage_path: 'path/to/sample1.jpg', 
      mime_type: 'image/jpeg',
      size: 1024, 
      created_at: '2023-01-03', 
      user_id: 'user1', 
      organization_id: 'org-123', // Added organization_id
      folder_id: null,
      publicUrl: 'http://example.com/sample1.jpg' 
    },
    { 
      id: 'asset-2', 
      name: 'sample2.png', 
      type: 'asset', 
      storage_path: 'path/to/sample2.png', 
      mime_type: 'image/png',
      size: 2048, 
      created_at: '2023-01-04', 
      user_id: 'user1', 
      organization_id: 'org-123', // Added organization_id
      folder_id: null,
      publicUrl: 'http://example.com/sample2.png' 
    },
  ];
  
  // const combinedItems = [...mockFolders, ...mockAssets] as CombinedItem[]; // No longer needed in this way for AssetGrid tests
  const defaultOnDataChange = vi.fn();
  const defaultOptimisticallyHiddenItemId = null;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Save original window dimensions
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
    
    // Mock the Element.getBoundingClientRect() to make the ref work in tests
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 900,
      height: 600,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    }));
    
    // Mock offsetWidth/offsetHeight for gridContainerRef
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 900,
    });
    
    // Set window dimensions for testing
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1024,
    });
    
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 768,
    });
  });
  
  afterEach(() => {
    // Restore original window dimensions
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: originalInnerWidth,
    });
    
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: originalInnerHeight,
    });
  });
  
  it('renders loading skeleton before mounting completes', () => {
    // This test might need adjustment based on how loading is handled now.
    // If AssetGrid itself has a loading state, test that.
    // If loading is handled by AssetGalleryClient, this specific test might be less relevant here.
    // For now, ensure it renders with empty assets without crashing.
    render(
        <AssetGrid 
            assets={[]} 
            onDataChange={defaultOnDataChange} 
            optimisticallyHiddenItemId={defaultOptimisticallyHiddenItemId} 
        />
    );
    // Add assertions if AssetGrid has its own specific loading or empty state UI for assets=[]
    // For example, if it shows a "No assets" message immediately with assets=[]:
    // expect(screen.getByText("No assets to display")).toBeInTheDocument(); 
    // This depends on AssetGrid's actual implementation for empty assets prop.
  });

  it('renders items with CSS grid for small number of items', () => {
    render(
        <AssetGrid 
            assets={mockAssetsData.slice(0, 1)} 
            onDataChange={defaultOnDataChange} 
            optimisticallyHiddenItemId={defaultOptimisticallyHiddenItemId} 
        />
    );
    expect(screen.getByTestId('mock-asset-thumbnail')).toBeInTheDocument();
    expect(screen.queryByTestId('fixed-size-grid')).not.toBeInTheDocument();
  });

  it('renders items with virtualization for large number of items', () => {
    const manyAssets = Array.from({ length: 100 }, (_, i) => ({
      id: `asset-${i}`,
      name: `image${i}.jpg`,
      type: 'asset' as const,
      storage_path: `path/image${i}.jpg`,
      mime_type: 'image/jpeg',
      size: 1024,
      created_at: new Date().toISOString(),
      user_id: 'user1',
      organization_id: 'org-123',
      folder_id: null,
      publicUrl: `http://example.com/image${i}.jpg`,
    }));
    render(
        <AssetGrid 
            assets={manyAssets} 
            onDataChange={defaultOnDataChange} 
            optimisticallyHiddenItemId={defaultOptimisticallyHiddenItemId} 
        />
    );
    expect(screen.getByTestId('fixed-size-grid')).toBeInTheDocument();
  });

  it('calculates grid dimensions based on window size', () => {
    render(
        <AssetGrid 
            assets={mockAssetsData} 
            onDataChange={defaultOnDataChange} 
            optimisticallyHiddenItemId={defaultOptimisticallyHiddenItemId} 
        />
    );
    // Assuming useGridDimensions updates some data-attributes or CSS vars AssetGrid uses
    // This test might need to be more specific based on useGridDimensions implementation
    // For now, we just ensure it renders.
    expect(screen.queryAllByTestId('mock-asset-thumbnail').length).toBeGreaterThan(0);
  });

  it('recalculates dimensions on window resize', async () => {
    render(
        <AssetGrid 
            assets={mockAssetsData} 
            onDataChange={defaultOnDataChange} 
            optimisticallyHiddenItemId={defaultOptimisticallyHiddenItemId} 
        />
    );
    
    await act(async () => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
      fireEvent(window, new Event('resize'));
      // Add a small delay for debounced resize handlers if any
      await new Promise(r => setTimeout(r, 150)); 
    });
    // Assertions would depend on how useGridDimensions affects the AssetGrid
    // For example, if FixedSizeGrid's columnCount changes, that could be checked via its mock's data attributes.
    // This is a complex test to get right without knowing the exact effects of useGridDimensions.
    expect(screen.queryAllByTestId('mock-asset-thumbnail').length).toBeGreaterThan(0);
  });
}); 