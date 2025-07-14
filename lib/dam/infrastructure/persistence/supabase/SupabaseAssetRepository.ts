import { SupabaseClient } from '@supabase/supabase-js';
import { IAssetRepository, CreateAssetData, UpdateAssetData } from '../../../domain/repositories/IAssetRepository';
import { Asset } from '../../../domain/entities/Asset';
import { AssetMapper as _AssetMapper, RawAssetDbRecord as _RawAssetDbRecord } from './mappers/AssetMapper';
import { createClient } from '@/lib/supabase/client';
import type { AssetSearchCriteria, DamFilterParameters, DamSortParameters } from '../../../application/dto/SearchCriteriaDTO';
import { DatabaseError as _DatabaseError } from '@/lib/errors/base';
import { 
  AssetQueryBuilder, 
  AssetDateFilter, 
  AssetTagService, 
  AssetProfileService, 
  AssetUrlService,
  AssetDataProcessor,
  AssetQueryExecutor
} from './services';

/**
 * Supabase Asset Repository Implementation
 * Follows DDD principles with specialized services for different concerns
 */

export class SupabaseAssetRepository implements IAssetRepository {
  private supabase: SupabaseClient;
  private queryBuilder: AssetQueryBuilder;
  private tagService: AssetTagService;
  private dataProcessor: AssetDataProcessor;
  private queryExecutor: AssetQueryExecutor;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient ?? createClient();
    this.queryBuilder = new AssetQueryBuilder(this.supabase);
    this.tagService = new AssetTagService(this.supabase);
    this.queryExecutor = new AssetQueryExecutor(this.supabase);
    
    // Data processor needs profile and URL services
    const profileService = new AssetProfileService(this.supabase);
    const urlService = new AssetUrlService(this.supabase);
    this.dataProcessor = new AssetDataProcessor(profileService, urlService);
  }

  async findById(id: string): Promise<Asset | null> {
    const data = await this.queryExecutor.executeFindById(id);
    if (!data) return null;
    
    return await this.dataProcessor.processRawDataForFindById(data);
  }

  async findByFolderId(
    folderId: string | null, 
    organizationId: string,
    sortParams?: DamSortParameters,
    filters?: DamFilterParameters
  ): Promise<Asset[]> {
    // Build query using query builder service
    let query = this.queryBuilder.buildBaseQuery();
    query = this.queryBuilder.applyOrganizationFilter(query, organizationId);
    query = this.queryBuilder.applyFolderFilter(query, folderId);

    // Apply filters using services
    if (filters) {
      if (filters.type === 'folder') {
        return []; // No assets if type filter is 'folder'
      }
      
             query = this.queryBuilder.applyTypeFilter(query, filters.type);
       query = AssetDateFilter.applyDateFilters(query, filters);
       query = this.queryBuilder.applyOwnerFilter(query, filters.ownerId);
       query = this.queryBuilder.applySizeFilter(query, filters.sizeOption, filters.sizeMin, filters.sizeMax);
    }

    // Apply sorting
    query = this.queryBuilder.applySorting(query, sortParams);

    const data = await this.queryExecutor.executeQuery(query, `fetching assets for folder ${folderId} with filters/sort`);
    return await this.dataProcessor.processRawDataArray(data);
  }

  async findByName(name: string, organizationId: string, folderId?: string | null): Promise<Asset[]> {
    // Build query using query builder service
    let query = this.queryBuilder.buildBaseQuery();
    query = this.queryBuilder.applyOrganizationFilter(query, organizationId);
    query = this.queryBuilder.applyNameFilter(query, name);
    query = this.queryBuilder.applyFolderFilter(query, folderId);

    const data = await this.queryExecutor.executeQuerySafe(query, `fetching assets by name ${name}`);
    return await this.dataProcessor.processRawDataArray(data);
  }

  async search(criteria: AssetSearchCriteria): Promise<Asset[]> {
    // Build query using query builder service
    let query = this.queryBuilder.buildBaseQuery();
    query = this.queryBuilder.applyOrganizationFilter(query, criteria.organizationId);
    query = this.queryBuilder.applySearchFilter(query, criteria.searchTerm);
    query = this.queryBuilder.applyFolderFilter(query, criteria.folderId);

    // Apply filters using services
    if (criteria.filters?.type === 'folder') {
      return [];
    }
    
    query = this.queryBuilder.applyTypeFilter(query, criteria.filters?.type);

    // Tag filtering
    if (criteria.tagIds && criteria.tagIds.length > 0) {
      const tagFilterResult = await this.tagService.getAssetIdsForTags(criteria.tagIds);
      if (tagFilterResult === 'error') {
        console.warn('Proceeding search without tag filter due to subquery error.');
      } else if (tagFilterResult === 'no_match') {
        return [];
      } else if (tagFilterResult && tagFilterResult.length > 0) {
        query = this.queryBuilder.applyTagFilter(query, tagFilterResult);
      }
    }

    // Apply remaining filters
    if (criteria.filters) {
      query = AssetDateFilter.applyDateFilters(query, criteria.filters);
      query = this.queryBuilder.applyOwnerFilter(query, criteria.filters.ownerId);
      query = this.queryBuilder.applySizeFilter(query, criteria.filters.sizeOption, criteria.filters.sizeMin, criteria.filters.sizeMax);
    }

    // Apply sorting and limits
    query = this.queryBuilder.applySorting(query, criteria.sortParams);
    query = this.queryBuilder.applyLimit(query, criteria.limitOptions?.parsedLimit);

    const data = await this.queryExecutor.executeQuery(query, 'searching assets');
    return await this.dataProcessor.processRawDataArray(data);
  }

  async save(assetData: CreateAssetData): Promise<Asset> {
    const data = await this.queryExecutor.executeSave(assetData);
    return await this.dataProcessor.processSingleRawRecord(data);
  }

  async update(assetId: string, data: UpdateAssetData): Promise<Asset | null> {
    const updatedData = await this.queryExecutor.executeUpdate(assetId, data);
    if (!updatedData) return null;
    
    return await this.dataProcessor.processSingleRawRecord(updatedData);
  }

  async delete(id: string): Promise<boolean> {
    return await this.queryExecutor.executeDelete(id);
  }

  async getStoragePath(assetId: string): Promise<string | null> {
    return await this.queryExecutor.executeGetStoragePath(assetId);
  }
}
