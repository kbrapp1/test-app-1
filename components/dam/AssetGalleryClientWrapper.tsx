'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AssetGrid } from './AssetGrid';
import { Asset, Folder, CombinedItem } from '@/types/dam';
import { getAssetsAndFoldersForGallery } from '@/lib/actions/dam/asset.actions'; // Action to refetch data
import { useToast } from '@/components/ui/use-toast';

interface AssetGalleryClientWrapperProps {
    initialCombinedItems: CombinedItem[];
    initialAssets: Asset[];
    initialFolders: Folder[];
    currentFolderId: string | null;
}

export function AssetGalleryClientWrapper({
    initialCombinedItems,
    // initialAssets, // We might not need to pass these separately if combinedItems is comprehensive
    // initialFolders,
    currentFolderId,
}: AssetGalleryClientWrapperProps) {
    const [combinedItems, setItems] = useState<CombinedItem[]>(initialCombinedItems);
    const { toast } = useToast();

    // Effect to update local state if initial props change (e.g., navigation to a different folder)
    useEffect(() => {
        setItems(initialCombinedItems);
    }, [initialCombinedItems]);

    const handleDataChange = useCallback(async () => {
        // This function is called when AssetGrid reports a change (e.g., after an asset move)
        // We should refetch the data for the current folder to ensure consistency.
        try {
            // console.log(`[ClientWrapper] handleDataChange triggered. Refetching for folder: ${currentFolderId}`);
            const result = await getAssetsAndFoldersForGallery(currentFolderId);
            if (result.success && result.data) {
                setItems(result.data.combinedItems);
                // toast({ title: "Gallery updated" }); // Optional: notify user of refresh
            } else {
                toast({ title: "Error refreshing gallery", description: result.error || "Could not fetch updated items.", variant: "destructive" });
            }
        } catch (error) {
            console.error("Error refetching gallery data:", error);
            toast({ title: "Error", description: "An unexpected error occurred while refreshing the gallery.", variant: "destructive" });
        }
    }, [currentFolderId, toast]);

    if (combinedItems.length === 0) {
        return <p>This folder is empty.</p>; // Match server component's empty message
    }
    
    // The Asset[] and Folder[] props for AssetGrid are optional and for testing/mocking if needed.
    // For operational use, combinedItems is the primary data source for AssetGrid.
    return (
        <AssetGrid 
            combinedItems={combinedItems} 
            setItems={setItems} 
            onDataChange={handleDataChange} 
            // assets={initialAssets} // Pass if AssetGrid needs them separately for some reason
            // folders={initialFolders} // Pass if AssetGrid needs them separately
        />
    );
} 