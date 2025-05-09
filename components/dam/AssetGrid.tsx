'use client';

// Make sure all necessary hooks and components are imported
import React, { useMemo, useState, useEffect, useRef, SetStateAction, Dispatch } from 'react'; 
import { useRouter } from 'next/navigation';
import { DndContext, closestCenter, pointerWithin, type DragEndEvent, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
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
    onDataChange: () => Promise<void>;
    setItems: Dispatch<SetStateAction<CombinedItem[]>>;
}

// Constants
const PRIORITY_THRESHOLD = 5;
const VIRTUALIZE_THRESHOLD = 30;
const CELL_SIZE = 225;

// The Client Component
export const AssetGrid = React.memo<AssetGridProps>(({ combinedItems, onDataChange, setItems }) => {
    const { toast } = useToast();
    const router = useRouter(); 
    const [optimisticallyHiddenItemId, setOptimisticallyHiddenItemId] = useState<string | null>(null);
    const itemIds = useMemo(() => combinedItems.map(item => item.id), [combinedItems]);
    const { ref: gridDimensionsRef, dimensions, hasMounted } = useGridDimensions();

    // Define sensors with activation constraints
    const sensors = useSensors(
        useSensor(PointerSensor, {
            // Require the mouse to move by 10 pixels before activating
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            // Press delay of 250ms, tolerance of 5px of movement
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
        // KeyboardSensor can be added here if needed
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!active || !over) return;

        const isActiveAsset = active.data.current?.type === 'asset';
        const isOverFolder = over.data.current?.type === 'folder';
        const isOverRootDroppable = over.id === 'root-droppable';

        if (isActiveAsset && (isOverFolder || isOverRootDroppable)) {
            const assetId = active.id as string;
            const targetFolderId = isOverRootDroppable ? null : over.id as string;
            
            // Get current folder ID from the dragged item's data
            const currentAssetFolderId = active.data.current?.item?.folder_id; // Access nested item data

            // Prevent redundant moves
            if (currentAssetFolderId === targetFolderId) {
                console.log('Asset is already in the target folder. No move needed.');
                return;
            }

            // Optimistically hide the item locally IMMEDIATELY
            setOptimisticallyHiddenItemId(assetId);

            try {
                // Note: Consider showing a loading state here
                const result = await moveAsset(assetId, targetFolderId);
                if (result.success) {
                    toast({ title: 'Asset moved successfully!' });
                    
                    // Optimistic UI Update: Remove item immediately
                    setItems(prevItems => prevItems.filter(item => item.id !== assetId));
                    
                    // Fetch latest data from server to ensure consistency (no await needed for visual update)

                } else {
                    toast({ title: 'Error moving asset', description: result.error, variant: 'destructive' });
                    // Move failed, unhide the item
                    setOptimisticallyHiddenItemId(null);
                }
            } catch (error) {
                console.error("Move asset error:", error); // Log the error
                toast({ title: 'Error', description: 'An unexpected error occurred while moving the asset.', variant: 'destructive' });
                // Move failed, unhide the item
                setOptimisticallyHiddenItemId(null);
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
                sensors={sensors}
                collisionDetection={pointerWithin}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={itemIds} strategy={verticalListSortingStrategy} disabled={true}>
                    <div className="grid grid-cols-[repeat(auto-fit,225px)] gap-4">
                        {combinedItems.map((item, index) => {
                            // Hide optimistically removed item
                            if (item.id === optimisticallyHiddenItemId) return null;
                            return (
                                <AssetGridItem 
                                    key={item.id}
                                    item={item}
                                    index={index}
                                    priorityThreshold={PRIORITY_THRESHOLD}
                                    onDataChange={onDataChange}
                                />
                            );
                        })}
                    </div>
                </SortableContext>
            </DndContext>
        );
    }

    // Calculate columns based on available width, with a minimum of 2 columns
    const COLS = Math.max(2, Math.floor(dimensions.width / CELL_SIZE) || 6);
    const rowCount = Math.ceil(combinedItems.length / COLS);
    
    const Cell = ({ columnIndex, rowIndex, style }: any) => {
        const index = rowIndex * COLS + columnIndex;
        if (index >= combinedItems.length) return null;
        const item = combinedItems[index];
        
        // Hide optimistically removed item
        if (item.id === optimisticallyHiddenItemId) return null;
        
        return (
            <div style={style}>
                <AssetGridItem 
                    item={item} 
                    index={index} 
                    priorityThreshold={PRIORITY_THRESHOLD} 
                    onDataChange={onDataChange}
                />
            </div>
        );
    };
    
    const grid = (
        <DndContext 
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy} disabled={true}>
                <FixedSizeGrid
                    columnCount={COLS}
                    columnWidth={CELL_SIZE}
                    height={dimensions.height || 500}
                    rowCount={rowCount}
                    rowHeight={CELL_SIZE}
                    width={dimensions.width || 500}
                    itemData={combinedItems}
                >
                    {Cell}
                </FixedSizeGrid>
            </SortableContext>
        </DndContext>
    );

    return (
        <div ref={gridDimensionsRef} style={{ width: '100%', height: 'calc(100vh - 200px)' }}>
            {grid}
        </div>
    );
});
