"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { AssetGrid } from './AssetGrid';
import { FolderListItem } from './FolderListItem';
import type { CombinedItem, Folder, Asset } from '@/types/dam';
import {
  DndContext,
  pointerWithin,
} from '@dnd-kit/core';
import { useToast } from '@/components/ui/use-toast';
import { AssetListItem } from './AssetListItem';
import { damTableColumns } from './dam-column-config';
import { useAssetGalleryData } from '@/components/dam/hooks/useAssetGalleryData';
import { useAssetDragAndDrop } from '@/components/dam/hooks/useAssetDragAndDrop';

interface AssetGalleryClientProps {
  currentFolderId: string | null;
  searchTerm?: string;
  tagIds?: string;
  viewMode: ViewMode;
  filterType?: string;
  filterCreationDateOption?: string;
  filterDateStart?: string;
  filterDateEnd?: string;
  filterOwnerId?: string;
  filterSizeOption?: string;
  filterSizeMin?: string;
  filterSizeMax?: string;
  sortBy?: string;
  sortOrder?: string;
}

export type ViewMode = 'grid' | 'list';

export const AssetGalleryClient: React.FC<AssetGalleryClientProps> = (props) => {
  const { 
    currentFolderId, 
    searchTerm, 
    tagIds, 
    viewMode, 
    filterType,
    filterCreationDateOption,
    filterDateStart,
    filterDateEnd,
    filterOwnerId,
    filterSizeOption,
    filterSizeMin,
    filterSizeMax,
    sortBy,
    sortOrder,
  } = props;

  const [optimisticallyHiddenItemId, setOptimisticallyHiddenItemId] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    allItems,
    loading,
    isFirstLoad,
    fetchData: refreshGalleryData,
    setAllItems,
  } = useAssetGalleryData(props);

  const { sensors, handleDragEnd } = useAssetDragAndDrop({
    setAllItems,
    setOptimisticallyHiddenItemId,
    toast,
  });

  useEffect(() => {
    setOptimisticallyHiddenItemId(null);
  }, [props]);

  const { folders, assets } = useMemo(() => {
    const separatedFolders: Folder[] = [];
    const separatedAssets: Asset[] = [];
    allItems.forEach((item: CombinedItem) => {
      if (item.type === 'folder') {
        separatedFolders.push(item as Folder);
      } else if (item.type === 'asset' && item.id !== optimisticallyHiddenItemId) {
        separatedAssets.push(item as Asset);
      }
    });
    separatedFolders.sort((a, b) => a.name.localeCompare(b.name));
    return { folders: separatedFolders, assets: separatedAssets };
  }, [allItems, optimisticallyHiddenItemId]);

  if (loading && isFirstLoad) return (
    <div className="text-center p-8">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"></div>
      <p>Loading...</p>
    </div>
  );

  if (!loading && folders.length === 0 && assets.length === 0) {
    return (
      <div className="text-center p-8">
        {searchTerm ? (
          <p>No results found for "{searchTerm}".</p>
        ) : (
          <p>This folder is empty.</p>
        )}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
      <div>
        {folders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 px-1">Folders</h2>
            <div className="flex flex-wrap gap-4">
              {folders.map(folder => (
                <FolderListItem 
                  key={folder.id} 
                  folder={folder} 
                  onDataChange={refreshGalleryData}
                />
              ))}
            </div>
          </div>
        )}

        {assets.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-4 px-1">Assets</h2>
            {viewMode === 'grid' ? (
              <AssetGrid 
                assets={assets} 
                onDataChange={refreshGalleryData}
                optimisticallyHiddenItemId={optimisticallyHiddenItemId}
              />
            ) : (
              <div className='flex flex-col gap-0'>
                <div className="flex items-center p-2 gap-4 border-b bg-muted/50 rounded-t-md">
                  {damTableColumns.map((col) => (
                    <div
                      key={`header-${col.id}`}
                      className={col.headerClassName}
                      style={col.headerStyle}
                    >
                      {col.headerName}
                    </div>
                  ))}
                </div>
                {assets.map(asset => (
                  <AssetListItem 
                    key={asset.id} 
                    item={asset}
                    onDataChange={refreshGalleryData} 
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {(loading && !isFirstLoad) && (
            <div className="text-center p-4 text-sm text-gray-500">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></div>
                Refreshing content...
            </div>
        )}
      </div>
    </DndContext>
  );
}; 