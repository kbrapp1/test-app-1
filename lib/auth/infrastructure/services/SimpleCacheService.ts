/**
 * Simple Cache Service - Auth Domain Infrastructure
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Cache invalidation for super admin operations
 * - KISS approach: Direct cache invalidation without over-abstraction
 * - Replaces 4 specialized services + orchestrator (~600 lines) with 1 simple service (~100 lines)
 * - Maintains all external API compatibility
 * - Keep under 100 lines following @golden-rule patterns
 * - CLIENT/SERVER COMPATIBLE: Works in both client and server contexts
 */

interface Profile {
  is_super_admin?: boolean;
}

/**
 * Unified cache invalidation service
 * Simple, direct approach without specialized service abstraction
 */
export class SimpleCacheService {
  /**
   * Invalidate organization-specific cache
   * For super admin, invalidates across multiple organizations
   */
  static async invalidateOrganizationCache(
    organizationIds: string | string[],
    profile: Profile | null,
    cacheType: 'assets' | 'folders' | 'members' | 'all' = 'all'
  ): Promise<void> {
    // Only run cache invalidation on server side
    if (typeof window !== 'undefined') {
      return; // Client side - skip cache invalidation
    }

    try {
      // Dynamic import to avoid build errors
      const { revalidatePath, revalidateTag } = await import('next/cache');
      
      const orgIds = Array.isArray(organizationIds) ? organizationIds : [organizationIds];
      
      // Super admin gets global cache invalidation for 'ALL' request
      if (profile?.is_super_admin && orgIds.includes('ALL')) {
        await this.invalidateGlobalCache();
        return;
      }

      // Invalidate specific organization caches
      orgIds.forEach(orgId => {
        if (cacheType === 'assets' || cacheType === 'all') {
          revalidateTag(`org-${orgId}-assets`);
          revalidateTag(`org-${orgId}-dam`);
          revalidatePath(`/dam`);
        }
        
        if (cacheType === 'folders' || cacheType === 'all') {
          revalidateTag(`org-${orgId}-folders`);
          revalidateTag(`org-${orgId}-dam`);
          revalidatePath(`/dam`);
        }
        
        if (cacheType === 'members' || cacheType === 'all') {
          revalidateTag(`org-${orgId}-members`);
          revalidateTag(`org-${orgId}-team`);
          revalidatePath(`/team`);
        }
      });

      // Super admin gets additional cross-organization cache invalidation
      if (profile?.is_super_admin) {
        revalidateTag('super-admin-all-orgs');
        revalidateTag('super-admin-data');
      }
    } catch (error) {
      // Silently handle import errors (e.g., in client context)
      console.warn('Cache invalidation skipped:', error);
    }
  }

  /**
   * Invalidate all organizations cache (super admin only)
   */
  static async invalidateAllOrganizationsCache(profile: Profile | null): Promise<void> {
    if (!profile?.is_super_admin) {
      return;
    }

    await this.invalidateGlobalCache();
  }

  /**
   * Invalidate DAM cache after asset/folder operations
   */
  static async invalidateDamCache(
    operationType: 'asset' | 'folder',
    entityIds: string[],
    organizationIds: string[],
    profile: Profile | null
  ): Promise<void> {
    // Only run cache invalidation on server side
    if (typeof window !== 'undefined') {
      return; // Client side - skip cache invalidation
    }

    try {
      // Dynamic import to avoid build errors
      const { revalidateTag } = await import('next/cache');
      
      // Invalidate entity-specific cache
      entityIds.forEach(id => {
        revalidateTag(`${operationType}-${id}`);
      });

      // Invalidate organization cache
      await this.invalidateOrganizationCache(
        organizationIds, 
        profile, 
        operationType === 'asset' ? 'assets' : 'folders'
      );
    } catch (error) {
      // Silently handle import errors
      console.warn('DAM cache invalidation skipped:', error);
    }
  }

  /**
   * Invalidate team cache after member operations
   */
  static async invalidateTeamCache(
    organizationIds: string[],
    userIds: string[],
    profile: Profile | null
  ): Promise<void> {
    // Only run cache invalidation on server side
    if (typeof window !== 'undefined') {
      return; // Client side - skip cache invalidation
    }

    try {
      // Dynamic import to avoid build errors
      const { revalidateTag } = await import('next/cache');
      
      // Invalidate user-specific cache
      userIds.forEach(id => {
        revalidateTag(`user-${id}`);
      });

      // Invalidate organization member cache
      await this.invalidateOrganizationCache(organizationIds, profile, 'members');
    } catch (error) {
      // Silently handle import errors
      console.warn('Team cache invalidation skipped:', error);
    }
  }

  /**
   * Private: Global cache invalidation for super admin
   */
  private static async invalidateGlobalCache(): Promise<void> {
    // Only run cache invalidation on server side
    if (typeof window !== 'undefined') {
      return; // Client side - skip cache invalidation
    }

    try {
      // Dynamic import to avoid build errors
      const { revalidatePath, revalidateTag } = await import('next/cache');
      
      const globalTags = [
        'dam-assets',
        'dam-folders', 
        'dam-gallery',
        'org-members',
        'team-members',
        'super-admin-all-orgs',
        'super-admin-data'
      ];
      
      globalTags.forEach(tag => revalidateTag(tag));
      
      // Invalidate common paths
      revalidatePath('/dam');
      revalidatePath('/team');
      revalidatePath('/settings');
    } catch (error) {
      // Silently handle import errors
      console.warn('Global cache invalidation skipped:', error);
    }
  }
}

/**
 * External API functions for backward compatibility
 */
export async function invalidateDamCache(
  operationType: 'asset' | 'folder',
  entityIds: string[],
  organizationIds: string[],
  profile: Profile | null,
  additionalContext?: {
    folderIds?: (string | null)[];
    parentFolderIds?: (string | null)[];
  }
): Promise<void> {
  await SimpleCacheService.invalidateDamCache(operationType, entityIds, organizationIds, profile);
}

export async function invalidateTeamCache(
  organizationIds: string[],
  userIds: string[] = [],
  profile: Profile | null
): Promise<void> {
  await SimpleCacheService.invalidateTeamCache(organizationIds, userIds, profile);
} 