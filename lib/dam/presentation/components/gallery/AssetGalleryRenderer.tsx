import React from 'react';
import { GalleryItemDto } from '../../../application/use-cases/folders/ListFolderContentsUseCase';
import { AssetGridItem } from './AssetGridItem';
import { AssetListItem } from './AssetListItem';
import { FolderItem } from './FolderItem';

interface AssetGalleryRendererProps {
  viewMode: 'grid' | 'list';
  folders: (GalleryItemDto & { type: 'folder' })[];
  assets: (GalleryItemDto & { type: 'asset' })[];
  enableNavigation: boolean;
  onItemClick: (item: GalleryItemDto) => void;
  onFolderAction: (action: 'rename' | 'delete', folderId: string, folderName: string) => void;
  createAssetActions: (asset: GalleryItemDto & { type: 'asset' }) => {
    onViewDetails: () => void;
    onRename: () => void;
    onMove: () => void;
    onDelete: () => void;
  };
  renderType: 'assets' | 'folders';
  optimisticallyHiddenItemId?: string | null;
}

/**
 * AssetGalleryRenderer - Domain-Focused Rendering Component
 * 
 * Responsible for rendering gallery items based on view mode.
 * Separated from business logic for better maintainability.
 */
export const AssetGalleryRenderer: React.FC<AssetGalleryRendererProps> = ({
  viewMode,
  folders,
  assets,
  enableNavigation,
  onItemClick,
  onFolderAction,
  createAssetActions,
  renderType,
  optimisticallyHiddenItemId,
}) => {
  if (renderType === 'assets') {
    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {assets.map(asset => {
            const actions = createAssetActions(asset);
            return (
              <AssetGridItem 
                key={asset.id} 
                asset={asset}
                onClick={() => onItemClick(asset)}
                isOptimisticallyHidden={asset.id === optimisticallyHiddenItemId}
                {...actions}
              />
            );
          })}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {assets.map(asset => {
          const actions = createAssetActions(asset);
          return (
            <AssetListItem 
              key={asset.id} 
              asset={asset}
              onClick={() => onItemClick(asset)}
              isOptimisticallyHidden={asset.id === optimisticallyHiddenItemId}
              {...actions}
            />
          );
        })}
      </div>
    );
  }

  // Render folders
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {folders.map(folder => (
          <FolderItem 
            key={folder.id} 
            folder={folder}
            onClick={() => onItemClick(folder)}
            enableNavigation={enableNavigation}
            onAction={onFolderAction}
            variant="grid"
            isOptimisticallyHidden={folder.id === optimisticallyHiddenItemId}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
      {folders.map(folder => (
        <FolderItem 
          key={folder.id} 
          folder={folder}
          onClick={() => onItemClick(folder)}
          enableNavigation={enableNavigation}
          onAction={onFolderAction}
          variant="list"
          isOptimisticallyHidden={folder.id === optimisticallyHiddenItemId}
        />
      ))}
    </div>
  );
}; 
