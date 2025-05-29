/**
 * Infrastructure Service: Cache Operations
 * 
 * Single Responsibility: Handle low-level Next.js cache invalidation operations
 * Encapsulates revalidatePath and revalidateTag calls
 */

import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Low-level cache invalidation operations
 * Provides typed interface for Next.js cache operations
 */
export class CacheInfrastructure {
  /**
   * Invalidate specific cache tags
   */
  static invalidateTags(tags: string[]): void {
    tags.forEach(tag => revalidateTag(tag));
  }

  /**
   * Invalidate specific paths
   */
  static invalidatePaths(paths: Array<{ path: string; type?: 'layout' | 'page' }>): void {
    paths.forEach(({ path, type }) => {
      revalidatePath(path, type);
    });
  }

  /**
   * Invalidate entity-specific cache by ID
   */
  static invalidateEntityCache(entityType: string, entityIds: string[]): void {
    const tags = entityIds.map(id => `${entityType}-${id}`);
    this.invalidateTags(tags);
  }

  /**
   * Invalidate organization-specific cache
   */
  static invalidateOrganizationCache(organizationId: string, cacheTypes: string[]): void {
    const tags = [
      `org-${organizationId}`,
      ...cacheTypes.map(type => `org-${organizationId}-${type}`)
    ];
    this.invalidateTags(tags);
  }

  /**
   * Invalidate global cache patterns
   */
  static invalidateGlobalCache(cacheTypes: string[]): void {
    this.invalidateTags(cacheTypes);
  }

  /**
   * Invalidate DAM-related paths
   */
  static invalidateDamPaths(folderIds: string[] = []): void {
    const paths: Array<{ path: string; type?: 'layout' | 'page' }> = [
      { path: '/dam', type: 'layout' }
    ];

    // Add folder-specific paths
    folderIds.forEach(folderId => {
      if (folderId) {
        paths.push(
          { path: `/dam/folders/${folderId}`, type: 'layout' },
          { path: `/dam/folders/${folderId}`, type: 'page' }
        );
      }
    });

    this.invalidatePaths(paths);
  }

  /**
   * Invalidate team-related paths
   */
  static invalidateTeamPaths(): void {
    const paths: Array<{ path: string; type?: 'layout' | 'page' }> = [
      { path: '/team', type: 'layout' },
      { path: '/settings', type: 'layout' },
      { path: '/settings/org-roles', type: 'layout' }
    ];

    this.invalidatePaths(paths);
  }
} 