'use server';

import { revalidatePath } from 'next/cache';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { createClient as createSupabaseUserClient } from '@/lib/supabase/server';

// Import Usecases
// import { listTextAssetsUsecase, TextAssetSummary as UsecaseTextAssetSummary } from '@/lib/usecases/dam/listTextAssetsUsecase'; // Old import
import { ListTextAssetsUseCase, TextAssetSummaryDto } from '@/lib/dam/application/use-cases/ListTextAssetsUseCase'; // New import
import { SupabaseAssetRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseAssetRepository'; // New import
import { AppError } from '@/lib/errors/base'; // For catching specific errors

// import { getAssetContentUsecase } from '@/lib/usecases/dam/getAssetContentUsecase'; // Old import
import { GetAssetContentUseCase } from '@/lib/dam/application/use-cases/GetAssetContentUseCase'; // New import
import { SupabaseStorageService } from '@/lib/dam/infrastructure/storage/SupabaseStorageService'; // New import

// import { updateAssetTextUsecase } from '@/lib/usecases/dam/updateAssetTextUsecase'; // Old import
import { UpdateAssetTextUseCase } from '@/lib/dam/application/use-cases/UpdateAssetTextUseCase'; // New import

// import { saveAsNewTextAssetUsecase } from '@/lib/usecases/dam/saveAsNewTextAssetUsecase'; // Old import
import { CreateTextAssetUseCase } from '@/lib/dam/application/use-cases/CreateTextAssetUseCase'; // New import

// Use the new DTO for the return type
export async function listTextAssets(): Promise<{ success: boolean; data?: TextAssetSummaryDto[]; error?: string }> {
  const supabaseClient = createSupabaseUserClient(); // Renamed for clarity, used by repository
  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('listTextAssets Action: Auth Error', authError);
      return { success: false, error: 'User not authenticated.' };
    }
    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      console.error('listTextAssets Action: Active Organization ID not found.');
      return { success: false, error: 'Active organization not found.' };
    }

    // Instantiate repository and new use case
    const assetRepository = new SupabaseAssetRepository(supabaseClient);
    const listTextAssetsUseCase = new ListTextAssetsUseCase(assetRepository);

    const result = await listTextAssetsUseCase.execute({ organizationId: activeOrgId });

    return { success: true, data: result.assets };

  } catch (err: any) {
    console.error('listTextAssets Action: Error', err);
    if (err instanceof AppError) {
        return { success: false, error: err.message };
    }
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}

export async function getAssetContent(assetId: string): Promise<{ success: boolean; content?: string; error?: string }> {
  if (!assetId) {
    return { success: false, error: 'Asset ID is required.' };
  }
  const supabaseClient = createSupabaseUserClient(); // Renamed for clarity, used by repository/service
  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'User not authenticated.' };
    }
    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      return { success: false, error: 'Active organization not found.' };
    }

    // Instantiate repository, service, and new use case
    const assetRepository = new SupabaseAssetRepository(supabaseClient);
    const storageService = new SupabaseStorageService(supabaseClient);
    const getAssetContentUseCase = new GetAssetContentUseCase(assetRepository, storageService);

    const result = await getAssetContentUseCase.execute({ 
      organizationId: activeOrgId, 
      assetId 
    });

    return { success: true, content: result.content };

  } catch (err: any) {
    console.error('getAssetContent Action: Error', err);
    if (err instanceof AppError) {
        return { success: false, error: err.message };
    }
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}

export async function updateAssetText(
  assetId: string,
  newContent: string
): Promise<{ success: boolean; error?: string }> {
  if (!assetId) { return { success: false, error: 'Asset ID is required for update.' }; }
  
  const supabaseClient = createSupabaseUserClient();
  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) { return { success: false, error: 'User not authenticated.' }; }
    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) { return { success: false, error: 'Active organization not found.' }; }

    const assetRepository = new SupabaseAssetRepository(supabaseClient);
    const storageService = new SupabaseStorageService(supabaseClient);
    const updateAssetTextUseCase = new UpdateAssetTextUseCase(assetRepository, storageService);

    await updateAssetTextUseCase.execute({
      organizationId: activeOrgId,
      assetId,
      newContent,
    });

    revalidatePath('/dam', 'layout'); // Consider more specific revalidation if possible
    return { success: true };
  } catch (err: any) {
    console.error('updateAssetText Action: Error', err);
    if (err instanceof AppError) {
        return { success: false, error: err.message };
    }
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}

export async function saveAsNewTextAsset(
  content: string,
  desiredName: string,
  folderId?: string | null
): Promise<{ success: boolean; error?: string; data?: { newAssetId: string } }> {
  const supabaseClient = createSupabaseUserClient();
  try {
    // User and Org ID will be fetched within the action for the use case
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'User not authenticated.' };
    }
    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      return { success: false, error: 'Active organization not found.' };
    }

    const assetRepository = new SupabaseAssetRepository(supabaseClient);
    const storageService = new SupabaseStorageService(supabaseClient);
    const createTextAssetUseCase = new CreateTextAssetUseCase(assetRepository, storageService);

    const result = await createTextAssetUseCase.execute({
      organizationId: activeOrgId,
      userId: user.id,
      content,
      desiredName,
      folderId,
    });

    revalidatePath('/dam', 'layout');
    if (folderId) {
      revalidatePath(`/dam/folders/${folderId}`, 'layout');
    }

    return { success: true, data: { newAssetId: result.newAssetId } };
  } catch (err: any) {
    console.error('saveAsNewTextAsset Action: Error', err);
    if (err instanceof AppError) {
        return { success: false, error: err.message };
    }
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
} 