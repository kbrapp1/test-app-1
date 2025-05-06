'use client';

// Make sure all necessary hooks and components are imported
import React, { useMemo } from 'react'; 
import { useRouter } from 'next/navigation';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { moveAsset } from '@/lib/actions/dam'; 
import { useToast } from '@/components/ui/use-toast';
import { FixedSizeGrid } from 'react-window';
// Import shared types
import { Asset, Folder, CombinedItem } from '@/types/dam';
// Import our new components and hooks
import { AssetGridItem } from './AssetGridItem';
import { useGridDimensions } from '@/hooks/useGridDimensions';

// Props interface
interface AssetGridProps {
    combinedItems: CombinedItem[];
    // Optional arrays passed from server for testing
    assets?: Asset[];
    folders?: Folder[];
}

// Constants
const PRIORITY_THRESHOLD = 4;
const VIRTUALIZE_THRESHOLD = 30;
const CELL_SIZE = 150;

// The Client Component
export function AssetGrid({ combinedItems }: AssetGridProps) {
    const { toast } = useToast();
    const router = useRouter(); 
    const itemIds = useMemo(() => combinedItems.map(item => item.id), [combinedItems]);
    const { ref: gridContainerRef, dimensions, hasMounted } = useGridDimensions();

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
                } else {
                    toast({ title: 'Error moving asset', description: result.error, variant: 'destructive' });
                }
            } catch (error) {
                toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
            }
        }
    };

    // Show loading skeleton before mounting completes
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
    if (combinedItems.length <= VIRTUALIZE_THRESHOLD) {
        return (
            <DndContext 
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={itemIds} strategy={verticalListSortingStrategy} disabled={true}>
                    <div className="grid grid-cols-[repeat(auto-fit,150px)] gap-4">
                        {combinedItems.map((item, index) => (
                            <AssetGridItem 
                                key={item.id}
                                item={item}
                                index={index}
                                priorityThreshold={PRIORITY_THRESHOLD}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        );
    }

    // Calculate columns based on available width, with a minimum of 2 columns
    const COLS = Math.max(2, Math.floor(dimensions.width / CELL_SIZE) || 6);
    const rowCount = Math.ceil(combinedItems.length / COLS);
    
    return (
        <div ref={gridContainerRef} className="w-full h-full">
            {dimensions.width > 0 && (
                <FixedSizeGrid
                    columnCount={COLS}
                    rowCount={rowCount}
                    columnWidth={CELL_SIZE}
                    rowHeight={CELL_SIZE}
                    height={dimensions.height}
                    width={dimensions.width}
                >
                    {({ columnIndex, rowIndex, style }) => {
                        const index = rowIndex * COLS + columnIndex;
                        if (index >= combinedItems.length) return null;
                        const item = combinedItems[index];
                        
                        return (
                            <div style={style} key={item.id}>
                                <AssetGridItem 
                                    item={item}
                                    index={index}
                                    priorityThreshold={PRIORITY_THRESHOLD}
                                />
                            </div>
                        );
                    }}
                </FixedSizeGrid>
            )}
        </div>
    );
}
