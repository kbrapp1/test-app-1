'use server';

import { revalidatePath } from 'next/cache';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { ListTextAssetsUseCase, GetAssetContentUseCase, UpdateAssetTextUseCase, CreateTextAssetUseCase } from '../use-cases/assets';
import type { TextAssetSummaryDto } from '../use-cases/assets/ListTextAssetsUseCase';
import { SupabaseAssetRepository } from '../../infrastructure/persistence/supabase/SupabaseAssetRepository';
import { SupabaseStorageService } from '../../infrastructure/storage/SupabaseStorageService';
import { AppError } from '@/lib/errors/base';
import { apiDeduplicationService } from '../services/ApiDeduplicationService';

/**
 * Server Actions: Text Asset Management
 * 
 * DDD-compliant server actions for text asset operations.
 * All actions delegate to use cases following clean architecture patterns.
 */

export async function listTextAssets(): Promise<{ success: boolean; data?: TextAssetSummaryDto[]; error?: string }> {
  
  return apiDeduplicationService.deduplicateServerAction(
    'listTextAssets',
    [],
    async () => {
      return await executeListTextAssets();
    },
    1500 // 1.5 second deduplication window
  );
}

async function executeListTextAssets(): Promise<{ success: boolean; data?: TextAssetSummaryDto[]; error?: string }> {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('listTextAssets Action: Auth Error', authError);
      return { success: false, error: 'User not authenticated.' };
    }

    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      console.error('listTextAssets Action: Active Organization ID not found.');
      return { success: false, error: 'Active organization not found.' };
    }

    // Set up dependencies and execute use case
    const assetRepository = new SupabaseAssetRepository(supabase);
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

  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'User not authenticated.' };
    }

    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      return { success: false, error: 'Active organization not found.' };
    }

    // Set up dependencies and execute use case
    const assetRepository = new SupabaseAssetRepository(supabase);
    const storageService = new SupabaseStorageService(supabase);
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
  if (!assetId) { 
    return { success: false, error: 'Asset ID is required for update.' }; 
  }
  
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) { 
      return { success: false, error: 'User not authenticated.' }; 
    }

    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) { 
      return { success: false, error: 'Active organization not found.' }; 
    }

    // Set up dependencies and execute use case
    const assetRepository = new SupabaseAssetRepository(supabase);
    const storageService = new SupabaseStorageService(supabase);
    const updateAssetTextUseCase = new UpdateAssetTextUseCase(assetRepository, storageService);

    await updateAssetTextUseCase.execute({
      organizationId: activeOrgId,
      assetId,
      newContent,
    });

    // Cache invalidation for updated content - removed /dam revalidation for client-side fetching
    // revalidatePath('/dam', 'layout'); // REMOVED - causes unnecessary POST /dam calls
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
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'User not authenticated.' };
    }

    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      return { success: false, error: 'Active organization not found.' };
    }

    // Set up dependencies and execute use case
    const assetRepository = new SupabaseAssetRepository(supabase);
    const storageService = new SupabaseStorageService(supabase);
    const createTextAssetUseCase = new CreateTextAssetUseCase(assetRepository, storageService);

    const result = await createTextAssetUseCase.execute({
      organizationId: activeOrgId,
      userId: user.id,
      content,
      desiredName,
      folderId,
    });

    // Cache invalidation for new content - removed /dam revalidation for client-side fetching
    // revalidatePath('/dam', 'layout'); // REMOVED - causes unnecessary POST /dam calls
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

 
