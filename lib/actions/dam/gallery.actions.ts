'use server';

import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { SupabaseAssetRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseAssetRepository';
import { SupabaseFolderRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository';
import { ListFolderContentsUseCase, GalleryItemDto } from '@/lib/dam/application/use-cases/ListFolderContentsUseCase';
import { AppError } from '@/lib/errors/base';

// Action to fetch combined assets and folders for the gallery view
export async function getAssetsAndFoldersForGallery(
  currentFolderId: string | null
): Promise<{ success: boolean; data?: { items: GalleryItemDto[] }; error?: string }> {
  console.log(`[Action] Fetching gallery for folder: ${currentFolderId}`);
  const supabaseClient = createSupabaseServerClient();
  try {
    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      return { success: false, error: 'Active organization not found.' };
    }

    const assetRepository = new SupabaseAssetRepository(supabaseClient);
    const folderRepository = new SupabaseFolderRepository(supabaseClient);
    const listFolderContentsUseCase = new ListFolderContentsUseCase(assetRepository, folderRepository);

    const result = await listFolderContentsUseCase.execute({
      organizationId: activeOrgId,
      currentFolderId,
    });

    return { success: true, data: { items: result.items } };

  } catch (err: any) {
    console.error('getAssetsAndFoldersForGallery Action: Error', err);
    if (err instanceof AppError) {
        return { success: false, error: err.message };
    }
    return { success: false, error: err.message || 'An unexpected error occurred fetching gallery data.' };
  }
} 