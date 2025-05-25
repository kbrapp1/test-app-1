import { SupabaseClient } from '@supabase/supabase-js';
import type { DamFilterParameters, DamSortParameters } from '../../../../application/dto/SearchCriteriaDTO';

/**
 * Folder Query Builder Service
 * Follows Single Responsibility Principle - handles query construction for folders
 */
export class FolderQueryBuilder {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Build base query for folders with organization filter
   */
  buildBaseQuery(organizationId: string) {
    return this.supabase
      .from('folders')
      .select('*, has_children:folders!parent_folder_id(count)')
      .eq('organization_id', organizationId);
  }

  /**
   * Apply parent folder filter
   */
  applyParentFilter(query: any, parentId: string | null) {
    if (parentId === null) {
      return query.is('parent_folder_id', null);
    }
    return query.eq('parent_folder_id', parentId);
  }

  /**
   * Apply owner filter
   */
  applyOwnerFilter(query: any, ownerId?: string | null) {
    if (ownerId) {
      return query.eq('user_id', ownerId);
    }
    return query;
  }

  /**
   * Apply type filter for folders
   */
  applyTypeFilter(query: any, type?: string | null): any {
    // If type is specified and it's not 'folder', return empty result
    // as this method only handles folders
    if (type && type !== 'folder') {
      return null; // Signal that no folders should be returned
    }
    return query;
  }

  /**
   * Apply search filter
   */
  applySearchFilter(query: any, searchTerm?: string) {
    if (searchTerm) {
      return query.ilike('name', `%${searchTerm}%`);
    }
    return query;
  }

  /**
   * Apply name filter
   */
  applyNameFilter(query: any, name: string) {
    return query.eq('name', name);
  }

  /**
   * Apply sorting
   */
  applySorting(query: any, sortParams?: DamSortParameters) {
    const validSortColumns = ['name', 'created_at', 'updated_at'];
    let effectiveSortBy = sortParams?.sortBy || 'name';
    
    // Validate sort column for folders
    if (!validSortColumns.includes(effectiveSortBy)) {
      effectiveSortBy = 'name';
    }

    const sortOrderAsc = (sortParams?.sortOrder || 'asc') === 'asc';
    return query.order(effectiveSortBy, { ascending: sortOrderAsc });
  }

  /**
   * Apply pagination
   */
  applyPagination(query: any, limitOptions?: { offset?: number; limit?: number }) {
    if (limitOptions?.limit !== undefined && limitOptions.limit > 0) {
      const limit = limitOptions.limit;
      query = query.limit(limit);
      
      if (limitOptions.offset !== undefined && limitOptions.offset > 0) {
        const from = limitOptions.offset;
        const to = from + limit - 1;
        query = query.range(from, to);
      }
    }
    return query;
  }
} 
