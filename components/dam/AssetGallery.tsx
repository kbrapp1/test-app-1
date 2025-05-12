// Keep server-only imports
// import { createClient } from '@/lib/supabase/server'; // No longer needed directly
// import { cookies } from 'next/headers'; // No longer needed directly

// Remove client-side imports
// import { useMemo } from 'react';
// import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
// import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
// import { AssetThumbnail } from './AssetThumbnail'; 
// import { FolderThumbnail } from './FolderThumbnail'; 
// import { moveAsset } from '@/lib/actions/dam';
// import { useToast } from '@/hooks/use-toast';

// Import the new Client Component
import { AssetGrid } from './AssetGrid';

// Import the Client Component Wrapper
import { AssetGalleryClientWrapper } from './AssetGalleryClientWrapper';

// --- Import types from the central location --- 
import { Asset, Folder, CombinedItem } from '@/types/dam';

// --- Import the new server action --- 
import { getAssetsAndFoldersForGallery } from '@/lib/actions/dam/asset.actions';

// --- Main AssetGallery Server Component --- 
interface AssetGalleryProps {
    currentFolderId: string | null;
}

export async function AssetGallery({ currentFolderId }: AssetGalleryProps) {
    // Call the server action to fetch initial data
    const result = await getAssetsAndFoldersForGallery(currentFolderId);

    if (!result.success || !result.data) {
        // Handle error case - display error message
        const errorMessage = result.error || 'Failed to load gallery data.';
        return <p className="text-red-500">{errorMessage}</p>;
    }

    // Extract data from the successful result
    const { combinedItems } = result.data;
    
    // Separate assets and folders from combinedItems if needed by the client wrapper
    // (Currently, the wrapper primarily uses combinedItems, but let's pass them for potential use)
    const initialAssets = combinedItems.filter(item => item.type === 'asset') as Asset[];
    const initialFolders = combinedItems.filter(item => item.type === 'folder') as Folder[];

    // --- Render the Client Component Wrapper, passing initial data --- 
    return (
        <AssetGalleryClientWrapper
            initialCombinedItems={combinedItems}
            initialAssets={initialAssets} 
            initialFolders={initialFolders}
            currentFolderId={currentFolderId} 
        />
    );
} 