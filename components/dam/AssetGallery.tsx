import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { AssetThumbnail } from './AssetThumbnail'; // Import the new component

// Define type for asset data (adjust based on actual table columns)
interface Asset {
    id: string;
    name: string;
    storage_path: string;
    mime_type: string;
    size: number;
    created_at: string;
    user_id: string | null;
    // Add other fields as needed
}

export async function AssetGallery() {
    // const cookieStore = cookies(); // Not needed for server client creation
    const supabase = createClient(); // No argument needed for server client

    // --- 1. Fetch Asset Records ---
    // TODO: Add user_id filter if authentication is implemented and needed
    const { data: assets, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching assets:', error);
        // Consider returning a more user-friendly error component
        return <p className="text-red-500">Error loading assets: {error.message}</p>;
    }

    if (!assets || assets.length === 0) {
        return <p>No assets found.</p>;
    }

    // --- 2. Generate Public URLs ---
    // We need to do this for each asset
    const assetsWithUrls = assets.map((asset: Asset) => {
        const { data } = supabase
            .storage
            .from('assets') // Ensure this matches your bucket name
            .getPublicUrl(asset.storage_path);

        return {
            ...asset,
            publicUrl: data?.publicUrl || '/placeholder.png', // Fallback URL
        };
    });

    // --- 3. Render Gallery ---
    const PRIORITY_THRESHOLD = 4; // Prioritize the first N images
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {assetsWithUrls.map((asset: Asset & { publicUrl: string }, index: number) => (
                <div key={asset.id} className="aspect-square relative border rounded-md overflow-hidden group">
                   <AssetThumbnail
                        src={asset.publicUrl}
                        alt={asset.name}
                        assetId={asset.id}
                        storagePath={asset.storage_path}
                        isPriority={index < PRIORITY_THRESHOLD} // Pass the priority flag
                    />
                   {/* Remove the direct Image rendering */}
                   {/*
                    <Image
                        src={asset.publicUrl}
                        alt={asset.name}
                        fill
                        sizes="..."
                        className="..."
                        onError={...}
                    />
                    */}
                   {/* Remove hover overlay comment as button handles interaction */}
                </div>
            ))}
        </div>
    );
} 