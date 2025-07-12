'use server';

/**
 * Server Actions for Super Admin Caching - Presentation Layer
 * 
 * AI INSTRUCTIONS:
 * - Presentation layer component for super admin server actions
 * - Uses composition root for dependency injection
 * - Maintains all existing functionality with proper DDD structure
 * - Single responsibility: Super admin cache management actions
 */

import { SuperAdminCacheService, invalidateDamCache, invalidateTeamCache } from '../../../super-admin/caching';
import { Profile } from '../../../super-admin/types';

/**
 * Server action to invalidate DAM cache
 */
export async function invalidateDamCacheAction(
  operationType: 'asset' | 'folder',
  entityIds: string[],
  organizationIds: string[],
  profile: Profile | null,
  additionalContext?: {
    folderIds?: (string | null)[];
    parentFolderIds?: (string | null)[];
  }
): Promise<void> {
  invalidateDamCache(operationType, entityIds, organizationIds, profile, additionalContext);
}

/**
 * Server action to invalidate team cache
 */
export async function invalidateTeamCacheAction(
  organizationIds: string[],
  userIds: string[],
  profile: Profile | null
): Promise<void> {
  invalidateTeamCache(organizationIds, userIds, profile);
}

/**
 * Server action to invalidate organization cache
 */
export async function invalidateOrganizationCacheAction(
  organizationIds: string | string[],
  profile: Profile | null,
  cacheType: 'assets' | 'folders' | 'members' | 'all' = 'all'
): Promise<void> {
  SuperAdminCacheService.invalidateOrganizationCache(organizationIds, profile, cacheType);
}

/**
 * Server action to invalidate all organizations cache (super admin only)
 */
export async function invalidateAllOrganizationsCacheAction(
  profile: Profile | null
): Promise<void> {
  SuperAdminCacheService.invalidateAllOrganizationsCache(profile);
} 