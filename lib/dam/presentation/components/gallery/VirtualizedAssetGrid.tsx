'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { GalleryItemDto } from '../../../application/use-cases/ListFolderContentsUseCase';
import { AssetDetailsModal } from '../dialogs/AssetDetailsModal';
import { Folder, FileText, Image, Video, Music, File, Eye } from 'lucide-react';

/**
 * VirtualizedAssetGrid - High-Performance Domain-Driven Grid Component
 * 
 * This component demonstrates advanced DDD presentation patterns:
 * - Uses domain DTOs (GalleryItemDto) for type safety
 * - Handles large datasets (1000+ items) with virtualization
 * - Clean separation between assets and folders
 * - Responsive design with proper grid calculations
 * - Performance optimized for production use
 * - Integrates with asset details management
 */

interface VirtualizedAssetGridProps {
  items: GalleryItemDto[];
  viewMode: 'grid' | 'list';
  onItemClick?: (item: GalleryItemDto) => void;
  onItemAction?: (action: string, item: GalleryItemDto) => void;
  optimisticallyHiddenItemId?: string;
  onAssetUpdated?: () => void;
  onAssetDeleted?: () => void;
}

export const VirtualizedAssetGrid: React.FC<VirtualizedAssetGridProps> = ({
  items,
  viewMode,
  onItemClick,
  onItemAction,
  optimisticallyHiddenItemId,
  onAssetUpdated,
  onAssetDeleted,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Filter out optimistically hidden items
  const visibleItems = useMemo(() => 
    items.filter(item => item.id !== optimisticallyHiddenItemId),
    [items, optimisticallyHiddenItemId]
  );

  // Calculate grid dimensions based on view mode
  const { itemsPerRow, itemHeight } = useMemo(() => {
    if (viewMode === 'list') {
      return { itemsPerRow: 1, itemHeight: 80 };
    }
    
    // Grid mode: Calculate based on container width
    // Default to 4 columns, but this could be responsive
    return { itemsPerRow: 4, itemHeight: 200 };
  }, [viewMode]);

  // Calculate total rows needed
  const totalRows = Math.ceil(visibleItems.length / itemsPerRow);

  // Create virtualizer
  const virtualizer = useVirtualizer({
    count: totalRows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  });

  const getItemIcon = (item: GalleryItemDto) => {
    if (item.type === 'folder') {
      return <Folder className="w-5 h-5 text-blue-600" />;
    }

    const mimeType = item.mimeType?.toLowerCase() || '';
    
    if (mimeType.startsWith('image/')) {
      return <Image className="w-5 h-5 text-green-600" />;
    }
    if (mimeType.startsWith('video/')) {
      return <Video className="w-5 h-5 text-purple-600" />;
    }
    if (mimeType.startsWith('audio/')) {
      return <Music className="w-5 h-5 text-orange-600" />;
    }
    if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('xml')) {
      return <FileText className="w-5 h-5 text-gray-600" />;
    }
    
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const handleItemClick = (item: GalleryItemDto) => {
    if (item.type === 'asset') {
      setSelectedAssetId(item.id);
    }
    onItemClick?.(item);
  };

  const handleAssetUpdated = () => {
    onAssetUpdated?.();
  };

  const handleAssetDeleted = () => {
    onAssetDeleted?.();
    setSelectedAssetId(null);
  };

  const renderGridItem = (item: GalleryItemDto) => (
    <div
      className="group cursor-pointer p-2"
      onClick={() => handleItemClick(item)}
    >
      <div className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow h-full">
        {/* Preview Area */}
        <div className="h-32 bg-gray-100 rounded-t-lg flex items-center justify-center relative overflow-hidden">
          {item.type === 'asset' && item.publicUrl && item.mimeType?.startsWith('image/') ? (
            <img 
              src={item.publicUrl} 
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400">
              {getItemIcon(item)}
            </div>
          )}
          
          {/* Hover overlay for assets */}
          {item.type === 'asset' && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Eye className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* Item Info */}
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            {getItemIcon(item)}
            <h3 className="font-medium text-sm text-gray-900 truncate flex-1">
              {item.name}
            </h3>
          </div>

          {item.type === 'asset' && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{'size' in item && typeof item.size === 'number' ? `${Math.round(item.size / 1024)} KB` : 'Unknown size'}</span>
              {item.mimeType && (
                <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                  {item.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                </span>
              )}
            </div>
          )}

          {item.type === 'folder' && (
            <p className="text-xs text-gray-500">
              {'assetCount' in item && typeof item.assetCount === 'number' ? `${item.assetCount} items` : 'Folder'}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderListItem = (item: GalleryItemDto) => (
    <div
      className="group cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => handleItemClick(item)}
    >
      <div className="flex items-center p-4 border-b">
        <div className="flex-shrink-0 mr-4">
          {item.type === 'asset' && item.publicUrl && item.mimeType?.startsWith('image/') ? (
            <img 
              src={item.publicUrl} 
              alt={item.name}
              className="w-12 h-12 object-cover rounded"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
              {getItemIcon(item)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getItemIcon(item)}
            <h3 className="font-medium text-sm text-gray-900 truncate">
              {item.name}
            </h3>
          </div>

          {item.type === 'asset' && (
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{'size' in item && typeof item.size === 'number' ? `${Math.round(item.size / 1024)} KB` : 'Unknown size'}</span>
              {item.mimeType && (
                <span className="bg-gray-100 px-2 py-1 rounded">
                  {item.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                </span>
              )}
            </div>
          )}

          {item.type === 'folder' && (
            <p className="text-xs text-gray-500">
              {'assetCount' in item && typeof item.assetCount === 'number' ? `${item.assetCount} items` : 'Folder'}
            </p>
          )}
        </div>

        {item.type === 'asset' && (
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Eye className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );

  if (visibleItems.length === 0) {
    return (
      <div className="text-center py-12">
        <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No items found
        </h3>
        <p className="text-gray-500">
          No assets or folders to display.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Performance Stats */}
        <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
          🚀 <strong>Virtualized:</strong> Rendering {virtualizer.getVirtualItems().length} of {visibleItems.length} items for optimal performance
        </div>

        {/* Virtualized Container */}
        <div
          ref={parentRef}
          className="h-96 overflow-auto border rounded-lg"
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const rowItems = [];
              const startIndex = virtualRow.index * itemsPerRow;
              
              for (let i = 0; i < itemsPerRow && startIndex + i < visibleItems.length; i++) {
                rowItems.push(visibleItems[startIndex + i]);
              }

              return (
                <div
                  key={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-4 gap-2 h-full">
                      {rowItems.map((item) => (
                        <div key={item.id}>
                          {renderGridItem(item)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full">
                      {rowItems.map((item) => (
                        <div key={item.id}>
                          {renderListItem(item)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Asset Details Modal */}
      <AssetDetailsModal
        open={!!selectedAssetId}
        onOpenChange={(open) => !open && setSelectedAssetId(null)}
        assetId={selectedAssetId}
        onAssetUpdated={handleAssetUpdated}
        onAssetDeleted={handleAssetDeleted}
      />
    </>
  );
};

export default VirtualizedAssetGrid; 