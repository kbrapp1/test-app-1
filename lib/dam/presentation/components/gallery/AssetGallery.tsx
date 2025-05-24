import { getActiveOrganizationId } from '@/lib/auth/server-action';

// Domain imports - using proper DDD use cases
import { ListFolderContentsUseCase, type GalleryItemDto } from '../../../application/use-cases/ListFolderContentsUseCase';
import { SupabaseAssetRepository } from '../../../infrastructure/persistence/supabase/SupabaseAssetRepository';
import { SupabaseFolderRepository } from '../../../infrastructure/persistence/supabase/SupabaseFolderRepository';
import { createClient } from '@/lib/supabase/server';

/**
 * AssetGallery - Server Component (Migrated to DAM Domain)
 * 
 * This component now follows DDD principles:
 * - Uses domain use cases instead of server actions
 * - Properly separated from infrastructure concerns
 * - Clean dependency direction: Presentation -> Application -> Domain
 */

interface DamAssetGalleryProps {
  currentFolderId: string | null;
}

export async function AssetGallery({ currentFolderId }: DamAssetGalleryProps) {
  try {
    // Get organization context
    const organizationId = await getActiveOrganizationId();
    if (!organizationId) {
      return <p className="text-red-500">Organization not found.</p>;
    }

    // Initialize repositories
    const supabase = createClient();
    const assetRepository = new SupabaseAssetRepository(supabase);
    const folderRepository = new SupabaseFolderRepository(supabase);

    // Use domain use case instead of server action
    const listFolderContentsUseCase = new ListFolderContentsUseCase(
      assetRepository,
      folderRepository
    );

    // Execute use case with correct parameters
    const result = await listFolderContentsUseCase.execute({
      organizationId,
      currentFolderId,
    });

    // Separate folders and assets from the gallery items
    const folders = result.items.filter((item): item is GalleryItemDto & { type: 'folder' } => 
      item.type === 'folder'
    );
    const assets = result.items.filter((item): item is GalleryItemDto & { type: 'asset' } => 
      item.type === 'asset'
    );

    // Render simple domain-driven UI
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">DAM Gallery (Domain-Driven)</h2>
        <div className="text-sm text-gray-600">
          Found {folders.length} folders and {assets.length} assets
        </div>
        
        {folders.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Folders</h3>
            <div className="grid grid-cols-4 gap-4">
              {folders.map(folder => (
                <div key={folder.id} className="p-4 border rounded bg-blue-50 hover:bg-blue-100 cursor-pointer">
                  <h4 className="font-medium">📁 {folder.name}</h4>
                  <p className="text-xs text-gray-500">Created: {folder.createdAt.toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {assets.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Assets</h3>
            <div className="grid grid-cols-4 gap-4">
              {assets.map(asset => (
                <div key={asset.id} className="p-4 border rounded bg-green-50 hover:bg-green-100 cursor-pointer">
                  <h4 className="font-medium">📄 {asset.name}</h4>
                  <p className="text-xs text-gray-500">{asset.mimeType}</p>
                  <p className="text-xs text-gray-500">Created: {asset.createdAt.toLocaleDateString()}</p>
                  {asset.publicUrl && (
                    <a 
                      href={asset.publicUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-blue-500 hover:underline"
                    >
                      View
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {folders.length === 0 && assets.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>This folder is empty.</p>
          </div>
        )}
      </div>
    );

  } catch (error) {
    console.error('Error in AssetGallery:', error);
    return (
      <p className="text-red-500">
        Failed to load gallery data: {error instanceof Error ? error.message : 'Unknown error'}
      </p>
    );
  }
}

export default AssetGallery; 