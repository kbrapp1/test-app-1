'use server';

import { getActiveOrganizationId } from '@/lib/auth';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { GetAssetDownloadUrlUseCase } from '../use-cases/assets';
import { SupabaseAssetRepository } from '../../infrastructure/persistence/supabase/SupabaseAssetRepository';
import { SupabaseStorageService } from '../../infrastructure/storage/SupabaseStorageService';
import { checkDamFeatureFlag } from '../services/DamFeatureFlagService';

/**
 * Server Action: Get Asset Download URL
 * 
 * DDD-compliant server action that provides a download URL for an asset.
 * Follows the pattern: Server Action → Use Case → Repository/Service
 * 
 * @param assetId - ID of the asset to get download URL for
 * @param forceDownload - Whether to force download (vs inline display)
 * @returns Promise with success status and download URL or error message
 */

export async function getAssetDownloadUrl(
  assetId: string,
  forceDownload: boolean = true
): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {

  try {
    await checkDamFeatureFlag();
    
    // 1. Get organization context
    const organizationId = await getActiveOrganizationId();
    if (!organizationId) {
      return { success: false, error: 'Active organization not found.' };
    }

    // 2. Set up infrastructure dependencies
    const supabase = createSupabaseServerClient();
    const assetRepository = new SupabaseAssetRepository(supabase);
    const storageService = new SupabaseStorageService(supabase);

    // 3. Execute use case with proper dependency injection
    const useCase = new GetAssetDownloadUrlUseCase(assetRepository, storageService);
    const result = await useCase.execute({
      assetId,
      organizationId,
      forceDownload,
    });

    return { success: true, downloadUrl: result.downloadUrl };

  } catch (error: any) {
    console.error('getAssetDownloadUrl action error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to get asset download URL.' 
    };
  }
} 
