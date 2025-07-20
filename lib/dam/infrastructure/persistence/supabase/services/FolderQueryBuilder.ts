import { SupabaseClient } from '@supabase/supabase-js';
import type { SearchFilters as _SearchFilters, SearchSortParams } from '../../../../application/dto/SearchCriteriaDTO';

type SupabaseQueryBuilder = ReturnType<ReturnType<SupabaseClient['from']>['select']>;

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
  applyParentFilter(query: SupabaseQueryBuilder, parentId: string | null): SupabaseQueryBuilder {
    if (parentId === null) {
      return query.is('parent_folder_id', null);
    }
    return query.eq('parent_folder_id', parentId);
  }

  /**
   * Apply owner filter
   */
  applyOwnerFilter(query: SupabaseQueryBuilder, ownerId?: string | null): SupabaseQueryBuilder {
    if (ownerId) {
      return query.eq('user_id', ownerId);
    }
    return query;
  }

  /**
   * Apply type filter for folders
   */
  applyTypeFilter(query: SupabaseQueryBuilder, type?: string | null): SupabaseQueryBuilder | null {
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
  applySearchFilter(query: SupabaseQueryBuilder, searchTerm?: string): SupabaseQueryBuilder {
    if (searchTerm && searchTerm.trim() !== '') {
      return query.ilike('name', `%${searchTerm}%`);
    }
    
    return query;
  }

  /**
   * Apply name filter
   */
  applyNameFilter(query: SupabaseQueryBuilder, name: string): SupabaseQueryBuilder {
    return query.eq('name', name);
  }

  /**
   * Apply sorting
   */
  applySorting(query: SupabaseQueryBuilder, sortParams?: SearchSortParams): SupabaseQueryBuilder {
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
  applyPagination(query: SupabaseQueryBuilder, limitOptions?: { offset?: number; limit?: number }): SupabaseQueryBuilder {
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
