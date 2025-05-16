'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { FixedSizeGrid } from 'react-window';
import { Asset, CombinedItem } from '@/types/dam';
import { AssetGridItem } from './AssetGridItem';
import { useGridDimensions } from '@/hooks/useGridDimensions';

interface AssetGridProps {
    assets: Asset[];
    onDataChange: () => Promise<void>;
    optimisticallyHiddenItemId: string | null;
}

const PRIORITY_THRESHOLD = 5;
const VIRTUALIZE_THRESHOLD = 30;
const CELL_SIZE = 225;

export const AssetGrid = React.memo<AssetGridProps>(({ assets, onDataChange, optimisticallyHiddenItemId }) => {
    const { ref: gridDimensionsRef, dimensions, hasMounted } = useGridDimensions();

    if (!hasMounted) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-pulse">
                {Array.from({ length: assets.length || 6 }).map((_, index) => (
                    <div key={index} className="aspect-square bg-muted rounded-md"></div>
                ))}
            </div>
        );
    }

    if (assets.length === 0) {
        return null;
    }

    if (assets.length <= VIRTUALIZE_THRESHOLD) {
        return (
            <div className="grid grid-cols-[repeat(auto-fit,225px)] gap-4">
                {assets.map((item, index) => {
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
        );
    }

    const COLS = Math.max(2, Math.floor(dimensions.width / CELL_SIZE) || 6);
    const rowCount = Math.ceil(assets.length / COLS);
    
    const Cell = ({ columnIndex, rowIndex, style, key }: any) => {
        const index = rowIndex * COLS + columnIndex;
        if (index >= assets.length) return null;
        const item = assets[index];
        
        if (item.id === optimisticallyHiddenItemId) return null;
        
        return (
            <div style={style} key={key || `cell-${item.id}`}>
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
        <FixedSizeGrid
            columnCount={COLS}
            columnWidth={CELL_SIZE}
            height={dimensions.height || 500}
            rowCount={rowCount}
            rowHeight={CELL_SIZE}
            width={dimensions.width || 500}
            itemData={assets}
        >
            {Cell}
        </FixedSizeGrid>
    );

    return (
        <div ref={gridDimensionsRef} style={{ width: '100%', height: 'calc(100vh - 200px)' }}>
            {grid}
        </div>
    );
});

AssetGrid.displayName = 'AssetGrid';
