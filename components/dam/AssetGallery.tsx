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
import { NewFolderDialog } from './new-folder-dialog';
import { DamBreadcrumbs } from './dam-breadcrumbs';
import { getActiveOrganizationId } from '@/lib/auth/server-action';

// --- Import the new server action --- 
// import { getAssetsAndFoldersForGallery } from '@/lib/actions/dam/asset.actions';

// --- Main AssetGallery Server Component --- 
import { Suspense } from 'react';
// import { DamAssetUploadDialog } from './DamAssetUploadDialog'; // Removed - file not found
import { getAssetsAndFoldersForGallery } from '@/lib/actions/dam/gallery.actions';
import { GalleryItemDto } from '@/lib/dam/application/use-cases/ListFolderContentsUseCase';
import { CombinedItem, ComponentAsset, ComponentFolder } from '@/lib/dam/types/component';

// Helper function to convert GalleryItemDto to CombinedItem
function convertGalleryItemToCombinedItem(item: GalleryItemDto): CombinedItem {
    if (item.type === 'folder') {
        return {
            type: 'folder',
            id: item.id,
            name: item.name,
            createdAt: item.createdAt,
            // Fill in required properties with defaults or empty values
            userId: '', // These would ideally come from the DTO, but are not available
            parentFolderId: null,
            organizationId: '',
            has_children: false,
            ownerName: '',
        } as ComponentFolder;
    } else {
        return {
            type: 'asset',
            id: item.id,
            name: item.name,
            created_at: item.createdAt.toISOString(),
            mime_type: item.mimeType,
            publicUrl: item.publicUrl || null,
            // Fill in required properties with defaults or empty values
            user_id: '',
            updated_at: null,
            storage_path: '',
            size: 0,
            folder_id: null,
            organization_id: '',
            ownerName: '',
            parentFolderName: null,
            tags: [],
        } as ComponentAsset;
    }
}

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

    // Extract data from the successful result and convert to CombinedItem[]
    const { items } = result.data;
    const combinedItems = items.map(convertGalleryItemToCombinedItem);
    
    // Separate assets and folders from combinedItems if needed by the client wrapper
    // (Currently, the wrapper primarily uses combinedItems, but let's pass them for potential use)
    // const initialAssets = combinedItems.filter(item => item.type === 'asset') as Asset[];
    // const initialFolders = combinedItems.filter(item => item.type === 'folder') as Folder[];

    // --- Render the Client Component Wrapper, passing initial data --- 
    return (
        <AssetGalleryClientWrapper
            initialCombinedItems={combinedItems}
            // initialAssets={initialAssets} // Removed
            // initialFolders={initialFolders} // Removed
            currentFolderId={currentFolderId} 
        />
    );
} 