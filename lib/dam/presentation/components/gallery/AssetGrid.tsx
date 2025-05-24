'use client';

import React, { useMemo } from 'react';
import { GalleryItemDto } from '../../../application/use-cases/ListFolderContentsUseCase';

/**
 * AssetGrid - Domain-Driven Grid Component
 * 
 * This component demonstrates proper DDD presentation patterns:
 * - Uses domain DTOs (GalleryItemDto) instead of API response types
 * - Clean separation between assets and folders
 * - Simplified but functional UI with proper responsive design
 * - Type-safe interaction with domain entities
 */

interface DomainAssetGridProps {
  items: GalleryItemDto[];
  viewMode: 'grid' | 'list';
  onItemClick?: (item: GalleryItemDto) => void;
  onItemAction?: (action: string, item: GalleryItemDto) => void;
  optimisticallyHiddenItemId?: string | null;
}

export const AssetGrid: React.FC<DomainAssetGridProps> = ({
  items,
  viewMode,
  onItemClick,
  onItemAction,
  optimisticallyHiddenItemId,
}) => {
  // Filter out optimistically hidden items
  const visibleItems = useMemo(() => 
    items.filter(item => item.id !== optimisticallyHiddenItemId),
    [items, optimisticallyHiddenItemId]
  );

  // Separate folders and assets for organized display
  const { folders, assets } = useMemo(() => {
    const folders = visibleItems.filter((item): item is GalleryItemDto & { type: 'folder' } => 
      item.type === 'folder'
    );
    const assets = visibleItems.filter((item): item is GalleryItemDto & { type: 'asset' } => 
      item.type === 'asset'
    );
    return { folders, assets };
  }, [visibleItems]);

  if (visibleItems.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No items to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Folders Section */}
      {folders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Folders</h3>
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
              : "space-y-2"
          }>
            {folders.map(folder => (
              <DomainFolderGridItem
                key={folder.id}
                folder={folder}
                viewMode={viewMode}
                onClick={() => onItemClick?.(folder)}
                onAction={(action) => onItemAction?.(action, folder)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Assets Section */}
      {assets.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Assets</h3>
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
              : "space-y-2"
          }>
            {assets.map(asset => (
              <DomainAssetGridItem
                key={asset.id}
                asset={asset}
                viewMode={viewMode}
                onClick={() => onItemClick?.(asset)}
                onAction={(action) => onItemAction?.(action, asset)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Domain-driven folder grid item component
interface DomainFolderGridItemProps {
  folder: GalleryItemDto & { type: 'folder' };
  viewMode: 'grid' | 'list';
  onClick: () => void;
  onAction: (action: string) => void;
}

const DomainFolderGridItem: React.FC<DomainFolderGridItemProps> = ({
  folder,
  viewMode,
  onClick,
  onAction,
}) => {
  if (viewMode === 'list') {
    return (
      <div 
        className="flex items-center p-3 border rounded-lg bg-white hover:bg-blue-50 cursor-pointer transition-colors"
        onClick={onClick}
      >
        <div className="flex-shrink-0 mr-3">
          <div className="text-2xl">📁</div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{folder.name}</h3>
          <p className="text-sm text-gray-500">
            Created: {folder.createdAt.toLocaleDateString()}
          </p>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction('menu');
            }}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            ⋮
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="group p-4 border rounded-lg bg-white hover:bg-blue-50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center">
        <div className="text-4xl mb-2">📁</div>
        <h3 className="font-medium text-sm truncate w-full">{folder.name}</h3>
        <p className="text-xs text-gray-500 mt-1">
          {folder.createdAt.toLocaleDateString()}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction('menu');
          }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
        >
          ⋮
        </button>
      </div>
    </div>
  );
};

// Domain-driven asset grid item component
interface DomainAssetGridItemProps {
  asset: GalleryItemDto & { type: 'asset' };
  viewMode: 'grid' | 'list';
  onClick: () => void;
  onAction: (action: string) => void;
}

const DomainAssetGridItem: React.FC<DomainAssetGridItemProps> = ({
  asset,
  viewMode,
  onClick,
  onAction,
}) => {
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    return '📄';
  };

  if (viewMode === 'list') {
    return (
      <div 
        className="flex items-center p-3 border rounded-lg bg-white hover:bg-green-50 cursor-pointer transition-colors"
        onClick={onClick}
      >
        <div className="flex-shrink-0 mr-3">
          <div className="text-2xl">{getFileIcon(asset.mimeType)}</div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{asset.name}</h3>
          <p className="text-sm text-gray-500">{asset.mimeType}</p>
          <p className="text-xs text-gray-500">
            Created: {asset.createdAt.toLocaleDateString()}
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center space-x-2">
          {asset.publicUrl && (
            <a 
              href={asset.publicUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-blue-500 hover:underline"
              onClick={e => e.stopPropagation()}
            >
              View
            </a>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction('menu');
            }}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            ⋮
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="group relative p-4 border rounded-lg bg-white hover:bg-green-50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center">
        <div className="text-4xl mb-2">{getFileIcon(asset.mimeType)}</div>
        <h3 className="font-medium text-sm truncate w-full">{asset.name}</h3>
        <p className="text-xs text-gray-500">{asset.mimeType}</p>
        <p className="text-xs text-gray-500 mt-1">
          {asset.createdAt.toLocaleDateString()}
        </p>
        {asset.publicUrl && (
          <a 
            href={asset.publicUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs text-blue-500 hover:underline mt-1"
            onClick={e => e.stopPropagation()}
          >
            View
          </a>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction('menu');
          }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
        >
          ⋮
        </button>
      </div>
    </div>
  );
};

export default AssetGrid; 