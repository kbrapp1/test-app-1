import React from 'react';
import { GalleryItemDto } from '../../../application/use-cases/folders/ListFolderContentsUseCase';
import { AssetListItem } from './AssetListItem';
import { FolderItem } from './folder-item';
import { SelectableEnhancedAssetGridItem } from '../assets/SelectableEnhancedAssetGridItem';
import { SelectableFolderItem } from '../folders/SelectableFolderItem';
import { EnhancedAssetGridItem } from './enhanced/EnhancedAssetGridItem';

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
  optimisticallyHiddenItemIds?: Set<string>;
  // Multi-select props
  enableMultiSelect?: boolean;
  multiSelect?: any;
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
  optimisticallyHiddenItemIds,
  enableMultiSelect,
  multiSelect,
}) => {
  if (renderType === 'assets') {
    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {assets.map(asset => {
            const actions = createAssetActions(asset);
            
            // Use enhanced selectable component when multi-select is enabled
            if (enableMultiSelect && multiSelect) {
              return (
                <SelectableEnhancedAssetGridItem 
                  key={asset.id} 
                  asset={asset}
                  onClick={() => onItemClick(asset)}
                  isOptimisticallyHidden={optimisticallyHiddenItemIds?.has(asset.id) || false}
                  isSelected={multiSelect.isSelected(asset.id, 'asset')}
                  isSelecting={multiSelect.isSelecting}
                  onSelectionChange={(selected: boolean) => {
                    // Always use toggleItem for consistent multi-select behavior
                      multiSelect.toggleItem(asset.id, 'asset');
                  }}
                  {...actions}
                />
              );
            }
            
            // Default non-selectable component with enhanced click vs drag
            return (
              <EnhancedAssetGridItem 
                key={asset.id} 
                asset={asset}
                onClick={() => onItemClick(asset)}
                isOptimisticallyHidden={optimisticallyHiddenItemIds?.has(asset.id) || false}
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
              isOptimisticallyHidden={optimisticallyHiddenItemIds?.has(asset.id) || false}
              // Selection props
              isSelected={enableMultiSelect && multiSelect ? multiSelect.isSelected(asset.id, 'asset') : false}
              isSelecting={enableMultiSelect && multiSelect ? multiSelect.isSelecting : false}
              onSelectionChange={enableMultiSelect && multiSelect ? (selected) => {
                // Always use toggleItem for consistent multi-select behavior
                  multiSelect.toggleItem(asset.id, 'asset');
              } : undefined}
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
        {folders.map(folder => {
          // Use selectable component when multi-select is enabled
          if (enableMultiSelect && multiSelect) {
            return (
              <SelectableFolderItem 
                key={folder.id} 
                folder={folder}
                onClick={() => onItemClick(folder)}
                enableNavigation={enableNavigation}
                onAction={onFolderAction}
                variant="grid"
                isOptimisticallyHidden={optimisticallyHiddenItemIds?.has(folder.id) || false}
                isSelected={multiSelect.isSelected(folder.id, 'folder')}
                isSelecting={multiSelect.isSelecting}
                onSelectionChange={(selected: boolean) => {
                  // Always use toggleItem for consistent multi-select behavior
                  multiSelect.toggleItem(folder.id, 'folder');
                }}
              />
            );
          }
          
          // Default non-selectable component
          return (
          <FolderItem 
            key={folder.id} 
            folder={folder}
            onClick={() => onItemClick(folder)}
            enableNavigation={enableNavigation}
            onAction={onFolderAction}
            variant="grid"
              isOptimisticallyHidden={optimisticallyHiddenItemIds?.has(folder.id) || false}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
      {folders.map(folder => {
        // Use selectable component when multi-select is enabled
        if (enableMultiSelect && multiSelect) {
          return (
            <SelectableFolderItem 
              key={folder.id} 
              folder={folder}
              onClick={() => onItemClick(folder)}
              enableNavigation={enableNavigation}
              onAction={onFolderAction}
              variant="list"
              isOptimisticallyHidden={optimisticallyHiddenItemIds?.has(folder.id) || false}
              isSelected={multiSelect.isSelected(folder.id, 'folder')}
              isSelecting={multiSelect.isSelecting}
              onSelectionChange={(selected: boolean) => {
                // Always use toggleItem for consistent multi-select behavior
                multiSelect.toggleItem(folder.id, 'folder');
              }}
            />
          );
        }
        
        // Default non-selectable component
        return (
        <FolderItem 
          key={folder.id} 
          folder={folder}
          onClick={() => onItemClick(folder)}
          enableNavigation={enableNavigation}
          onAction={onFolderAction}
          variant="list"
            isOptimisticallyHidden={optimisticallyHiddenItemIds?.has(folder.id) || false}
          />
        );
      })}
    </div>
  );
}; 
