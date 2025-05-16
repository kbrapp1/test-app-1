"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { AssetGrid } from './AssetGrid';
import { FolderListItem } from './FolderListItem';
import type { CombinedItem, Folder, Asset } from '@/types/dam';
import {
  DndContext,
  pointerWithin,
  type DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
} from '@dnd-kit/core';
import { moveAsset } from '@/lib/actions/dam/asset-crud.actions';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { AssetListItem } from './AssetListItem';

interface AssetGalleryClientProps {
  currentFolderId: string | null;
  initialSearchTerm?: string;
  viewMode: ViewMode;
}

export type ViewMode = 'grid' | 'list';

export const AssetGalleryClient: React.FC<AssetGalleryClientProps> = ({ currentFolderId, initialSearchTerm, viewMode }) => {
  const [allItems, setAllItems] = useState<CombinedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimisticallyHiddenItemId, setOptimisticallyHiddenItemId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async (folderIdToFetch: string | null, termToFetch: string | undefined) => {
    setLoading(true);
    setOptimisticallyHiddenItemId(null);
    try {
      const timestamp = new Date().getTime();
      const queryTerm = termToFetch || '';
      const apiUrl = `/api/dam?folderId=${folderIdToFetch ?? ''}&q=${encodeURIComponent(queryTerm)}&_=${timestamp}`;
      // console.log('AssetGalleryClient fetching:', apiUrl); // Keep console.log commented out unless debugging
      const res = await fetch(apiUrl, {
        cache: 'no-store'
      });

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }

      const data: CombinedItem[] = await res.json();
      setAllItems(data);
    } catch (e) {
      setAllItems([]);
      console.error("Error fetching DAM items:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentFolderId, initialSearchTerm);
  }, [currentFolderId, initialSearchTerm]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over) return;

    const isActiveAsset = active.data.current?.type === 'asset';
    const isOverFolder = over.data.current?.type === 'folder' && over.data.current?.accepts?.includes('asset');

    if (isActiveAsset && isOverFolder) {
      const assetId = active.id as string;
      const targetFolderId = over.id as string;
      
      const draggedAsset = active.data.current?.item as Asset | undefined;
      if (!draggedAsset) return;

      if (draggedAsset.folder_id === targetFolderId) {
        toast({ title: 'No Change', description: 'Asset is already in the target folder.', variant: 'default' });
        return;
      }

      setOptimisticallyHiddenItemId(assetId);

      try {
        const result = await moveAsset(assetId, targetFolderId);
        if (result.success) {
          toast({ title: 'Asset moved successfully!' });
          setAllItems(prevItems => prevItems.filter(item => item.id !== assetId));
        } else {
          toast({ title: 'Error moving asset', description: result.error, variant: 'destructive' });
          setOptimisticallyHiddenItemId(null);
        }
      } catch (error) {
        console.error("Move asset error:", error);
        toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
        setOptimisticallyHiddenItemId(null);
      }
    }
  };

  const { folders, assets } = useMemo(() => {
    const separatedFolders: Folder[] = [];
    const separatedAssets: Asset[] = [];
    allItems.forEach(item => {
      if (item.type === 'folder') {
        separatedFolders.push(item as Folder);
      } else if (item.type === 'asset') {
        separatedAssets.push(item as Asset);
      }
    });
    separatedFolders.sort((a, b) => a.name.localeCompare(b.name));
    return { folders: separatedFolders, assets: separatedAssets.filter(a => a.id !== optimisticallyHiddenItemId) };
  }, [allItems, optimisticallyHiddenItemId]);

  if (loading) return (
    <div className="text-center p-8">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"></div>
      <p>Loading...</p>
    </div>
  );

  if (folders.length === 0 && assets.length === 0 && !loading) {
    return (
      <div className="text-center p-8">
        {initialSearchTerm ? (
          <p>No results found for "{initialSearchTerm}".</p>
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
                  onDataChange={() => fetchData(currentFolderId, initialSearchTerm)}
                />
              ))}
            </div>
          </div>
        )}

        {(assets.length > 0 || (initialSearchTerm && folders.length === 0 && !loading)) && (
           <>
              {folders.length > 0 && assets.length > 0 && (
                <h2 className="text-xl font-semibold mt-8 mb-4 px-1">Files</h2>
              )}
              {!folders.length && assets.length > 0 && (
                <h2 className="text-xl font-semibold mb-4 px-1">Files</h2>
              )}
              {viewMode === 'grid' ? (
                <AssetGrid
                    assets={assets}
                    onDataChange={() => fetchData(currentFolderId, initialSearchTerm)}
                    optimisticallyHiddenItemId={optimisticallyHiddenItemId}
                />
              ) : (
                <div className='flex flex-col gap-0'>
                  {assets.map(asset => (
                    <AssetListItem 
                      key={asset.id} 
                      item={asset} 
                      onDataChange={() => fetchData(currentFolderId, initialSearchTerm)} 
                    />
                  ))}
                </div>
              )}
           </>
        )}
        
        {folders.length > 0 && assets.length === 0 && !initialSearchTerm && !loading && (
          <div className="text-center p-8 text-muted-foreground mt-4">
            <p>No files in this folder.</p>
          </div>
        )}
      </div>
    </DndContext>
  );
}; 