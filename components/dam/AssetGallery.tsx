// Keep server-only imports
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

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

// Keep shared types or move to a dedicated types file
import { Folder } from './folder-sidebar'; 
interface Asset {
    id: string;
    name: string;
    storage_path: string;
    mime_type: string;
    size: number;
    created_at: string;
    user_id: string | null;
    folder_id: string | null; 
}
interface GalleryItem extends Asset {
    type: 'asset';
    publicUrl: string;
}
interface FolderItem extends Folder {
    type: 'folder';
}
type CombinedItem = GalleryItem | FolderItem; // This type might be needed by AssetGrid, consider exporting it from here or a types file

// --- Main AssetGallery Server Component --- 
interface AssetGalleryProps {
    currentFolderId: string | null;
}

export async function AssetGallery({ currentFolderId }: AssetGalleryProps) {
    // console.log(`[Server] AssetGallery fetching for folderId: ${currentFolderId}`); // Log folder ID
    
    const supabase = createClient(); 

    // --- Fetch Folders --- (Existing logic)
    let folderQuery = supabase.from('folders').select('*');
    if (currentFolderId === null) { folderQuery = folderQuery.is('parent_folder_id', null); } 
    else { folderQuery = folderQuery.eq('parent_folder_id', currentFolderId); }
    const { data: foldersData, error: foldersError } = await folderQuery.order('name', { ascending: true });
    if (foldersError) {
        // console.error('Error fetching folders:', foldersError);
        return <p className="text-red-500">Error loading folders: {foldersError.message}</p>;
    }
    const folders: FolderItem[] = (foldersData || []).map(f => ({ ...f, type: 'folder' }));

    // --- Fetch Assets --- (Existing logic)
    let assetQuery = supabase.from('assets').select('*');
    if (currentFolderId === null) { assetQuery = assetQuery.is('folder_id', null); } 
    else { assetQuery = assetQuery.eq('folder_id', currentFolderId); }
    const { data: assetsData, error: assetsError } = await assetQuery.order('created_at', { ascending: false });
    if (assetsError) {
        // console.error('Error fetching assets:', assetsError);
        return <p className="text-red-500">Error loading assets: {assetsError.message}</p>;
    }

    // --- Generate Public URLs for Assets --- (Existing logic)
    const assetsWithUrls: GalleryItem[] = (assetsData || []).map((asset: Asset) => {
        const { data: urlData } = supabase.storage.from('assets').getPublicUrl(asset.storage_path);
        return {
            ...asset,
            type: 'asset',
            publicUrl: urlData?.publicUrl || '/placeholder.png',
        };
    });

    // --- Combine Data --- (Existing logic)
    const combinedItems: CombinedItem[] = [...folders, ...assetsWithUrls];
    
    // Log the combined items fetched by the server
    // console.log(`[Server] AssetGallery fetched ${combinedItems.length} items for folderId: ${currentFolderId}`, combinedItems.map(i => ({ id: i.id, type: i.type, name: i.name }))); 

    if (combinedItems.length === 0) {
        // console.log(`[Server] AssetGallery rendering empty message for folderId: ${currentFolderId}`);
        return <p>This folder is empty.</p>;
    }

    // --- Render the Client Component Wrapper ---
    // console.log(`[Server] AssetGallery rendering AssetGrid for folderId: ${currentFolderId}`);
    // Transform assets for the AssetGrid mock to pick up expected props
    const assetPropsForGrid = assetsWithUrls.map(asset => ({
        src: asset.publicUrl,
        alt: asset.name,
        assetId: asset.id,
        storagePath: asset.storage_path,
        folderId: asset.folder_id,
        type: asset.type,
    }));
    // Pass transformed assets and original folders to AssetGrid
    return <AssetGrid combinedItems={combinedItems} assets={assetPropsForGrid} folders={folders} />;
} 