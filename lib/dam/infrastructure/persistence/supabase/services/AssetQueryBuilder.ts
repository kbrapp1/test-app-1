import { SupabaseClient } from '@supabase/supabase-js';
import type { DamFilterParameters, DamSortParameters } from '../../../../application/dto/SearchCriteriaDTO';

/**
 * Asset Query Builder Service
 * Follows Single Responsibility Principle - only handles query building for assets
 */
export class AssetQueryBuilder {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Build base asset query with standard joins
   */
  buildBaseQuery() {
    return this.supabase
      .from('assets')
      .select('*, asset_tags(tags(*))');
  }

  /**
   * Apply organization filter to query
   */
  applyOrganizationFilter(query: any, organizationId: string) {
    return query.eq('organization_id', organizationId);
  }

  /**
   * Apply folder filter to query
   */
  applyFolderFilter(query: any, folderId: string | null | undefined) {
    if (folderId === null) {
      return query.is('folder_id', null);
    } else if (folderId !== undefined) {
      return query.eq('folder_id', folderId);
    }
    return query;
  }

  /**
   * Apply search term filter to query
   */
  applySearchFilter(query: any, searchTerm?: string) {
    if (searchTerm) {
      return query.ilike('name', `%${searchTerm}%`);
    }
    return query;
  }

  /**
   * Apply name filter to query
   */
  applyNameFilter(query: any, name: string) {
    return query.eq('name', name);
  }

  /**
   * Apply type filter to query
   */
  applyTypeFilter(query: any, type?: string | null) {
    if (!type || type === 'folder') {
      return query;
    }

    const typeMap: { [key: string]: string } = {
      'image': 'image/%',
      'video': 'video/%',
      'document': 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv',
      'audio': 'audio/%',
      'archive': 'application/zip,application/x-rar-compressed,application/x-7z-compressed'
    };

    if (typeMap[type]) {
      if (type === 'document' || type === 'archive') {
        const mimeTypes = typeMap[type].split(',');
        const orConditions = mimeTypes.map(mime => `mime_type.like.${mime.trim()}`).join(',');
        return query.or(orConditions);
      } else {
        return query.like('mime_type', typeMap[type]);
      }
    }
    return query;
  }

  /**
   * Apply owner filter to query
   */
  applyOwnerFilter(query: any, ownerId?: string | null) {
    if (ownerId) {
      return query.eq('user_id', ownerId);
    }
    return query;
  }

  /**
   * Apply size filter to query
   */
  applySizeFilter(query: any, sizeOption?: string | null, sizeMin?: string | null, sizeMax?: string | null) {
    if (!sizeOption || sizeOption === 'any') {
      return query;
    }

    switch (sizeOption) {
      case 'small':
        return query.lt('size', 1024 * 1024); // < 1MB
      case 'medium':
        return query.gte('size', 1024 * 1024).lte('size', 10 * 1024 * 1024); // 1MB - 10MB
      case 'large':
        return query.gte('size', 10 * 1024 * 1024).lte('size', 100 * 1024 * 1024); // 10MB - 100MB
      case 'xlarge':
        return query.gt('size', 100 * 1024 * 1024); // > 100MB
      case 'custom':
        if (sizeMin) query = query.gte('size', parseInt(sizeMin, 10));
        if (sizeMax) query = query.lte('size', parseInt(sizeMax, 10));
        return query;
      default:
        return query;
    }
  }

  /**
   * Apply sorting to query
   */
  applySorting(query: any, sortParams?: DamSortParameters) {
    const sortBy = sortParams?.sortBy || 'created_at';
    const sortOrderAsc = sortParams?.sortOrder === 'asc';
    const validSortColumns = ['name', 'created_at', 'updated_at', 'size', 'mime_type'];
    
    if (validSortColumns.includes(sortBy)) {
      return query.order(sortBy, { ascending: sortOrderAsc });
    } else {
      return query.order('created_at', { ascending: false }); // Default sort
    }
  }

  /**
   * Apply limit to query
   */
  applyLimit(query: any, limit?: number) {
    if (limit !== undefined && limit > 0) {
      return query.limit(limit);
    }
    return query;
  }

  /**
   * Apply tag filter to query
   */
  applyTagFilter(query: any, assetIds: string[]) {
    return query.in('id', assetIds);
  }
} 
