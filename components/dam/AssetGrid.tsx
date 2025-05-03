'use client';

// Make sure all necessary hooks and components are imported
import React, { useMemo, useState, useEffect, CSSProperties } from 'react'; 
import { useRouter } from 'next/navigation';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AssetThumbnail } from './AssetThumbnail'; 
import { FolderThumbnail } from './FolderThumbnail'; 
import { Folder } from './folder-sidebar'; 
import { moveAsset } from '@/lib/actions/dam'; 
import { useToast } from '@/hooks/use-toast';
import { FixedSizeGrid } from 'react-window';

// Define types (or import from shared location)
export interface Asset { 
    id: string; name: string; storage_path: string; mime_type: string; 
    size: number; created_at: string; user_id: string | null; folder_id: string | null; 
}
interface GalleryItem extends Asset { type: 'asset'; publicUrl: string; }
interface FolderItem extends Folder { type: 'folder'; }
export type CombinedItem = GalleryItem | FolderItem; // Export for use in client caching component

// Props interface
interface AssetGridProps {
    combinedItems: CombinedItem[];
    // Optional arrays passed from server for testing
    assets?: any[];
    folders?: any[];
}

// The Client Component
export function AssetGrid({ combinedItems, assets, folders }: AssetGridProps) {
    const [hasMounted, setHasMounted] = useState(false);
    const { toast } = useToast();
    const router = useRouter(); 
    const itemIds = useMemo(() => combinedItems.map(item => item.id), [combinedItems]);

    // Effect to log when combinedItems prop changes
    useEffect(() => {
        // Add a check for hasMounted to avoid logging initial server props as change
        if (hasMounted) { 
            // console.log(`[Client] AssetGrid useEffect detected combinedItems change. Items: ${combinedItems.length}`, combinedItems.map(i => ({ id: i.id, type: i.type, name: i.name })));
        }
    }, [combinedItems, hasMounted]); // Add hasMounted to dependency array

    // Effect for mounting
    useEffect(() => {
        setHasMounted(true);
    }, []);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!active || !over) return;

        const isActiveAsset = active.data.current?.type === 'asset';
        const isOverFolder = over.data.current?.type === 'folder';
        const isOverRootDroppable = over.id === 'root-droppable';

        if (isActiveAsset && (isOverFolder || isOverRootDroppable)) {
            const assetId = active.id as string;
            const targetFolderId = isOverRootDroppable ? null : over.id as string;
            
            if (active.data.current?.folderId === targetFolderId) return;

            try {
                const result = await moveAsset(assetId, targetFolderId);
                if (result.success) {
                    toast({ title: 'Asset moved successfully!' });
                    router.refresh(); 
                    // console.log('[Client] router.refresh() called after successful move.');
                } else {
                    // console.error('Failed to move asset:', result.error);
                    toast({ title: 'Error moving asset', description: result.error, variant: 'destructive' });
                }
            } catch (error) {
                // console.error('Error calling moveAsset action:', error);
                toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
            }
        }
    };

    const PRIORITY_THRESHOLD = 4;

    if (!hasMounted) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-pulse">
                {Array.from({ length: combinedItems.length || 6 }).map((_, index) => (
                    <div key={index} className="aspect-square bg-muted rounded-md"></div>
                ))}
            </div>
        );
    }

    // For small galleries, use CSS grid to preserve styling
    const VIRTUALIZE_THRESHOLD = 30;
    if (combinedItems.length <= VIRTUALIZE_THRESHOLD) {
        // Restore DND wrappers for consistent behavior/styling
        return (
            <DndContext 
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={itemIds} strategy={verticalListSortingStrategy} disabled={true}>
                    {/* Use auto-fit columns with a minimum width to prevent squishing */}
                    <div className="grid grid-cols-[repeat(auto-fit,150px)] gap-4">
                        {combinedItems.map((item, index) => (
                            item.type === 'folder' ? (
                                <FolderThumbnail key={item.id} folder={item as FolderItem} />
                            ) : (
                                <AssetThumbnail
                                    key={item.id}
                                    src={item.publicUrl}
                                    alt={item.name}
                                    assetId={item.id}
                                    storagePath={item.storage_path}
                                    folderId={item.folder_id}
                                    type={item.type}
                                    isPriority={index < PRIORITY_THRESHOLD && item.mime_type.startsWith('image/')}
                                />
                            )
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        );
    }

    // Virtualized grid rendering for performance
    const COLS = 6;
    const CELL_SIZE = 150;
    const rowCount = Math.ceil(combinedItems.length / COLS);
    return (
        <FixedSizeGrid
            columnCount={COLS}
            rowCount={rowCount}
            columnWidth={CELL_SIZE}
            rowHeight={CELL_SIZE}
            height={CELL_SIZE * 3}
            width={CELL_SIZE * COLS}
        >
            {({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: CSSProperties }) => {
                const index = rowIndex * COLS + columnIndex;
                if (index >= combinedItems.length) return null;
                const item = combinedItems[index];
                return (
                    // Outer div keeps positioning and size from react-window
                    <div style={style} key={item.id}>
                        {/* Inner wrapper for padding and full size */}
                        <div style={{ padding: '0.5rem', boxSizing: 'border-box', width: '100%', height: '100%' }}>
                            {item.type === 'folder' ? (
                                <FolderThumbnail folder={item as FolderItem} />
                            ) : (
                                <AssetThumbnail
                                    src={item.publicUrl}
                                    alt={item.name}
                                    assetId={item.id}
                                    storagePath={item.storage_path}
                                    folderId={item.folder_id}
                                    type={item.type}
                                    isPriority={index < PRIORITY_THRESHOLD && item.mime_type.startsWith('image/')}
                                />
                            )}
                        </div>
                    </div>
                );
            }}
        </FixedSizeGrid>
    );
}
