import { SupabaseClient } from '@supabase/supabase-js';
import { IAssetRepository, CreateAssetData, UpdateAssetData } from '../../../domain/repositories/IAssetRepository';
import { Asset } from '../../../domain/entities/Asset';
import { AssetMapper, RawAssetDbRecord } from './mappers/AssetMapper';
import { createClient } from '@/lib/supabase/client';
import type { AssetSearchCriteria, DamFilterParameters, DamSortParameters } from '../../../application/dto/SearchCriteriaDTO';
import { DatabaseError } from '@/lib/errors/base';

// Utility function to apply date filters (adapted from app/api/dam/dam-api.query-builders.ts)
// Renamed to avoid conflict if SupabaseFolderRepository also has one.
function applyAssetDateFiltersToQuery(query: any, filters: DamFilterParameters): any {
  if (!filters.creationDateOption) {
    return query;
  }
  const now = new Date();
  let dateFilterValue: string;
  let dateEndFilterValue: string | undefined;
  switch (filters.creationDateOption) {
    case 'today':
      dateFilterValue = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
      query = query.gte('created_at', dateFilterValue);
      break;
    case 'last7days':
      const last7DaysDate = new Date(now.valueOf());
      last7DaysDate.setUTCDate(now.getUTCDate() - 7);
      dateFilterValue = new Date(Date.UTC(last7DaysDate.getUTCFullYear(), last7DaysDate.getUTCMonth(), last7DaysDate.getUTCDate())).toISOString();
      query = query.gte('created_at', dateFilterValue);
      break;
    case 'last30days':
      const last30DaysDate = new Date(now.valueOf());
      last30DaysDate.setUTCDate(now.getUTCDate() - 30);
      dateFilterValue = new Date(Date.UTC(last30DaysDate.getUTCFullYear(), last30DaysDate.getUTCMonth(), last30DaysDate.getUTCDate())).toISOString();
      query = query.gte('created_at', dateFilterValue);
      break;
    case 'thisYear':
      dateFilterValue = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
      query = query.gte('created_at', dateFilterValue);
      break;
    case 'lastYear':
      dateFilterValue = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1)).toISOString();
      dateEndFilterValue = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
      query = query.gte('created_at', dateFilterValue).lt('created_at', dateEndFilterValue);
      break;
    case 'custom':
      if (filters.dateStart) {
        const [year, month, day] = filters.dateStart.split('-').map(Number);
        dateFilterValue = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)).toISOString();
        query = query.gte('created_at', dateFilterValue);
      }
      if (filters.dateEnd) {
        const [year, month, day] = filters.dateEnd.split('-').map(Number);
        dateEndFilterValue = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)).toISOString();
        query = query.lte('created_at', dateEndFilterValue);
      }
      break;
  }
  return query;
}

// Async helper specifically for fetching asset IDs based on tags (adapted from app/api/dam/dam-api.query-builders.ts)
async function getAssetIdsForTagSearch(supabase: SupabaseClient, tagIds?: string[]): Promise<string[] | 'no_match' | 'error' | null> {
  if (!tagIds || tagIds.length === 0) return null;

  const { data: matchingAssetIds, error: subQueryError } = await supabase
    .from('asset_tags')
    .select('asset_id')
    .in('tag_id', tagIds);

  if (subQueryError) {
    console.error('Tag filter subquery error:', subQueryError);
    return 'error';
  }
  if (matchingAssetIds && matchingAssetIds.length > 0) {
    return matchingAssetIds.map(r => r.asset_id);
  }
  return 'no_match';
}

export class SupabaseAssetRepository implements IAssetRepository {
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient ?? createClient();
  }

  async findById(id: string): Promise<Asset | null> {
    const { data, error } = await this.supabase
      .from('assets')
      .select('*, asset_tags(tags(*))')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching asset by ID:', error);
      return null;
    }
    if (!data) return null;
    
    const domainAsset = AssetMapper.toDomain(data as unknown as RawAssetDbRecord);
    return this.addPublicUrlToAsset(domainAsset);
  }

  async findByFolderId(
    folderId: string | null, 
    organizationId: string,
    sortParams?: DamSortParameters,
    filters?: DamFilterParameters
  ): Promise<Asset[]> {
    let query = this.supabase
      .from('assets')
      .select('*, asset_tags(tags(*))')
      .eq('organization_id', organizationId);

    if (folderId === null) {
      query = query.is('folder_id', null);
    } else {
      query = query.eq('folder_id', folderId);
    }

    // Apply filters
    if (filters) {
      // Type filter (similar to search, but simpler as we are only fetching assets)
      if (filters.type && filters.type !== 'folder') { // type 'folder' would mean no assets
        const typeMap: { [key: string]: string } = {
          'image': 'image/%',
          'video': 'video/%',
          'document': 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv',
          'audio': 'audio/%',
          'archive': 'application/zip,application/x-rar-compressed,application/x-7z-compressed'
        };
        if (typeMap[filters.type]) {
          if (filters.type === 'document' || filters.type === 'archive') {
            const mimeTypes = typeMap[filters.type].split(',');
            const orConditions = mimeTypes.map(mime => `mime_type.like.${mime.trim()}`).join(',');
            query = query.or(orConditions);
          } else {
            query = query.like('mime_type', typeMap[filters.type]);
          }
        }
      } else if (filters.type === 'folder') {
        return []; // No assets if type filter is 'folder'
      }

      // Date filtering
      query = applyAssetDateFiltersToQuery(query, filters); // Re-use existing utility

      // Owner filtering
      if (filters.ownerId) {
        query = query.eq('user_id', filters.ownerId);
      }

      // Size filtering
      if (filters.sizeOption && filters.sizeOption !== 'any') {
        switch (filters.sizeOption) {
          case 'small': query = query.lt('size', 1024 * 1024); break; // < 1MB
          case 'medium': query = query.gte('size', 1024 * 1024).lte('size', 10 * 1024 * 1024); break; // 1MB - 10MB
          case 'large': query = query.gte('size', 10 * 1024 * 1024).lte('size', 100 * 1024 * 1024); break; // 10MB - 100MB
          case 'xlarge': query = query.gt('size', 100 * 1024 * 1024); break; // > 100MB
          case 'custom':
            if (filters.sizeMin) query = query.gte('size', parseInt(filters.sizeMin, 10));
            if (filters.sizeMax) query = query.lte('size', parseInt(filters.sizeMax, 10));
            break;
        }
      }
    }

    // Apply sorting
    const sortBy = sortParams?.sortBy || 'created_at';
    const sortOrderAsc = sortParams?.sortOrder === 'asc';
    const validSortColumns = ['name', 'created_at', 'updated_at', 'size']; // Ensure these are actual column names
    if (validSortColumns.includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrderAsc });
    } else {
      query = query.order('created_at', { ascending: false }); // Default sort
    }

    const { data, error } = await query;
    if (error) {
      console.error(`Error fetching assets for folder ${folderId} with filters/sort:`, error);
      throw new DatabaseError(`Could not fetch assets for folder ${folderId}.`, error.message);
    }
    return (data || []).map(raw => this.mapRawToDomainWithPublicUrl(raw as unknown as RawAssetDbRecord));
  }

  async findByName(name: string, organizationId: string, folderId?: string | null): Promise<Asset[]> {
    let query = this.supabase
      .from('assets')
      .select('*, asset_tags(tags(*))')
      .eq('organization_id', organizationId)
      .eq('name', name);

    if (folderId === null) {
      query = query.is('folder_id', null);
    } else if (folderId !== undefined) {
      query = query.eq('folder_id', folderId);
    }

    const { data, error } = await query;
    if (error) {
      console.error(`Error fetching assets by name ${name}:`, error);
      return [];
    }
    return (data || []).map(raw => this.mapRawToDomainWithPublicUrl(raw as unknown as RawAssetDbRecord));
  }

  async search(criteria: AssetSearchCriteria): Promise<Asset[]> {
    let query = this.supabase
      .from('assets')
      .select('*, asset_tags(tags(*))')
      .eq('organization_id', criteria.organizationId);

    if (criteria.searchTerm) {
      query = query.ilike('name', `%${criteria.searchTerm}%`);
    }

    if (criteria.folderId === null) {
      query = query.is('folder_id', null);
    } else if (criteria.folderId !== undefined) {
      query = query.eq('folder_id', criteria.folderId);
    }
    
    if (criteria.filters?.type && criteria.filters.type !== 'folder') {
      const typeMap: { [key: string]: string } = {
        'image': 'image/%',
        'video': 'video/%',
        'document': 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv',
        'audio': 'audio/%',
        'archive': 'application/zip,application/x-rar-compressed,application/x-7z-compressed'
      };
      if (typeMap[criteria.filters.type]) {
        if (criteria.filters.type === 'document' || criteria.filters.type === 'archive') {
          const mimeTypes = typeMap[criteria.filters.type].split(',');
          const orConditions = mimeTypes.map(mime => `mime_type.like.${mime.trim()}`).join(',');
          query = query.or(orConditions);
        } else {
          query = query.like('mime_type', typeMap[criteria.filters.type]);
        }
      }
    } else if (criteria.filters?.type === 'folder') {
      return []; 
    }

    // Tag filtering
    if (criteria.tagIds && criteria.tagIds.length > 0) {
      const tagFilterResult = await getAssetIdsForTagSearch(this.supabase, criteria.tagIds);
      if (tagFilterResult === 'error') {
        // Decide handling: proceed without tag filter, or throw/return error
        console.warn('Proceeding search without tag filter due to subquery error.');
      } else if (tagFilterResult === 'no_match') {
        return []; // No assets match the tag, so return empty
      } else if (tagFilterResult && tagFilterResult.length > 0) {
        query = query.in('id', tagFilterResult);
      }
    }

    // Date filtering
    if (criteria.filters) {
      query = applyAssetDateFiltersToQuery(query, criteria.filters);
    }

    // Owner filtering
    if (criteria.filters?.ownerId) {
      query = query.eq('user_id', criteria.filters.ownerId);
    }

    // Size filtering
    if (criteria.filters?.sizeOption && criteria.filters.sizeOption !== 'any') {
      const filters = criteria.filters; // Alias for brevity
      switch (filters.sizeOption) {
        case 'small': query = query.lt('size', 1024 * 1024); break; // < 1MB
        case 'medium': query = query.gte('size', 1024 * 1024).lte('size', 10 * 1024 * 1024); break; // 1MB - 10MB
        case 'large': query = query.gte('size', 10 * 1024 * 1024).lte('size', 100 * 1024 * 1024); break; // 10MB - 100MB
        case 'xlarge': query = query.gt('size', 100 * 1024 * 1024); break; // > 100MB
        case 'custom':
          if (filters.sizeMin) query = query.gte('size', parseInt(filters.sizeMin, 10));
          if (filters.sizeMax) query = query.lte('size', parseInt(filters.sizeMax, 10));
          break;
      }
    }

    // Sorting
    const sortBy = criteria.sortParams?.sortBy || 'created_at';
    const sortOrderAsc = criteria.sortParams?.sortOrder === 'asc';
    // Ensure sortBy is a valid column name for assets table
    const validSortColumns = ['name', 'created_at', 'updated_at', 'size'];
    if (validSortColumns.includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrderAsc });
    } else {
      query = query.order('created_at', { ascending: false }); // Default sort
    }
    
    // Limit / Pagination
    if (criteria.limitOptions?.parsedLimit !== undefined && criteria.limitOptions.parsedLimit > 0) {
        const limit = criteria.limitOptions.parsedLimit;
        // Supabase pagination typically uses range(from, to)
        // For simplicity, just applying limit for now. Offset/page would need more logic.
        query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error searching assets:', error);
      throw new DatabaseError('Failed to search assets.', error.message);
    }

    return (data || []).map(raw => this.mapRawToDomainWithPublicUrl(raw as unknown as RawAssetDbRecord));
  }

  async save(assetData: CreateAssetData): Promise<Asset> {
    // Create Asset instance from the data to use the mapper
    const asset = new Asset({
      id: assetData.id || crypto.randomUUID(),
      userId: assetData.userId,
      name: assetData.name,
      storagePath: assetData.storagePath,
      mimeType: assetData.mimeType,
      size: assetData.size,
      createdAt: assetData.createdAt || new Date(),
      updatedAt: assetData.updatedAt,
      folderId: assetData.folderId,
      organizationId: assetData.organizationId,
    });

    const persistenceData = AssetMapper.toPersistence(asset);
    const { data, error } = await this.supabase
      .from('assets')
      .insert(persistenceData)
      .select('*, asset_tags(tags(*))')
      .single();

    if (error || !data) {
      console.error('Error saving asset:', error);
      throw new Error('Could not save asset');
    }
    return this.mapRawToDomainWithPublicUrl(data as unknown as RawAssetDbRecord);
  }

  async update(assetId: string, data: UpdateAssetData): Promise<Asset | null> {
    const persistenceData: Partial<Omit<RawAssetDbRecord, 'id' | 'created_at' | 'updated_at' | 'asset_tags'>> = {};
    if (data.name !== undefined) persistenceData.name = data.name;
    if (data.folderId !== undefined) persistenceData.folder_id = data.folderId;
    if (data.storagePath !== undefined) persistenceData.storage_path = data.storagePath;
    if (data.mimeType !== undefined) persistenceData.mime_type = data.mimeType;
    if (data.size !== undefined) persistenceData.size = data.size;

    const { data: updatedData, error } = await this.supabase
      .from('assets')
      .update(persistenceData)
      .eq('id', assetId)
      .select('*, asset_tags(tags(*))')
      .single();

    if (error) {
      console.error(`Error updating asset ${assetId}:`, error);
      return null;
    }
    if (!updatedData) return null;
    return this.mapRawToDomainWithPublicUrl(updatedData as unknown as RawAssetDbRecord);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('assets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting asset ${id}:`, error);
      return false;
    }
    return true;
  }

  async getStoragePath(assetId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('assets')
      .select('storage_path')
      .eq('id', assetId)
      .single();

    if (error || !data) {
      console.error('Error fetching storage path:', error);
      return null;
    }
    return data.storage_path;
  }

  private mapRawToDomainWithPublicUrl(raw: RawAssetDbRecord): Asset {
    const domainAsset = AssetMapper.toDomain(raw);
    return this.addPublicUrlToAsset(domainAsset);
  }

  private addPublicUrlToAsset(asset: Asset): Asset {
    if (!asset.storagePath) {
      return asset;
    }

    try {
      const { data: urlData } = this.supabase.storage.from('assets').getPublicUrl(asset.storagePath);
      // Create a new Asset instance with the publicUrl since it's readonly
      return new Asset({
        id: asset.id,
        userId: asset.userId,
        name: asset.name,
        storagePath: asset.storagePath,
        mimeType: asset.mimeType,
        size: asset.size,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
        folderId: asset.folderId,
        organizationId: asset.organizationId,
        tags: asset.tags,
        publicUrl: urlData.publicUrl,
      });
    } catch (e) {
      console.warn(`Failed to get public URL for ${asset.storagePath}`, e);
      return asset; // Return original asset without publicUrl
    }
  }
}
