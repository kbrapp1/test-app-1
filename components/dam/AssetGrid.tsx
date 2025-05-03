'use client';

// Make sure all necessary hooks and components are imported
import React, { useMemo, useState, useEffect } from 'react'; 
import { useRouter } from 'next/navigation';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AssetThumbnail } from './AssetThumbnail'; 
import { FolderThumbnail } from './FolderThumbnail'; 
import { Folder } from './folder-sidebar'; 
import { moveAsset } from '@/lib/actions/dam'; 
import { useToast } from '@/hooks/use-toast';

// Define types (or import from shared location)
interface Asset { 
    id: string; name: string; storage_path: string; mime_type: string; 
    size: number; created_at: string; user_id: string | null; folder_id: string | null; 
}
interface GalleryItem extends Asset { type: 'asset'; publicUrl: string; }
interface FolderItem extends Folder { type: 'folder'; }
type CombinedItem = GalleryItem | FolderItem;

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

    // Restore DND wrappers and original map logic
    return (
        <DndContext 
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy} disabled={true}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                     {combinedItems.map((item, index) => {
                        // console.log(`[Client] Rendering item: ${item.id} (${item.type})`); // Keep commented out for now
                         return item.type === 'folder' ? (
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
                         );
                     })}
                 </div>
             </SortableContext>
         </DndContext>
    );
}
