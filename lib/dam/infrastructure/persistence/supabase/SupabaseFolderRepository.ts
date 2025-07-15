import { SupabaseClient } from '@supabase/supabase-js';
import { IFolderRepository, FolderTreeNode, CreateFolderData, UpdateFolderData } from '../../../domain/repositories/IFolderRepository';
import { Folder } from '../../../domain/entities/Folder';
import { Asset } from '../../../domain/entities/Asset';
import { FolderMapper } from './mappers/FolderMapper';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { ValidationError } from '@/lib/errors/base';
import type { DamFilterParameters, DamSortParameters } from '../../../application/dto/SearchCriteriaDTO';
import { 
  FolderQueryBuilder, 
  FolderDateFilter, 
  FolderQueryExecutor, 
  FolderTreeService 
} from './services';

/**
 * Supabase Folder Repository Implementation
 * Follows DDD principles with specialized services for different concerns
 */
export class SupabaseFolderRepository implements IFolderRepository {
  private supabase: SupabaseClient;
  private queryBuilder: FolderQueryBuilder;
  private queryExecutor: FolderQueryExecutor;
  private treeService: FolderTreeService;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createSupabaseServerClient();
    this.queryBuilder = new FolderQueryBuilder(this.supabase);
    this.queryExecutor = new FolderQueryExecutor(this.supabase);
    this.treeService = new FolderTreeService(this.supabase);
  }

  async findById(id: string, organizationId: string): Promise<Folder | null> {
    if (!id) {
      console.warn('SupabaseFolderRepository.findById called with empty ID');
      return null;
    }
    
    if (!organizationId) {
      console.warn('SupabaseFolderRepository.findById called with empty organizationId');
      return null;
    }

    const query = this.queryBuilder.buildBaseQuery(organizationId).eq('id', id).maybeSingle();
    const data = await this.queryExecutor.executeSingleQuery(query, `fetching folder by ID ${id} for organization ${organizationId}`);
    
    if (!data) {
      console.info(`Folder with ID ${id} not found in organization ${organizationId}`);
      return null;
    }
    return FolderMapper.toDomain(data);
  }

  async findRootFolders(organizationId: string): Promise<Folder[]> {
    return this.findFoldersByParentId(null, organizationId);
  }

  async findFoldersByParentId(
    parentId: string | null, 
    organizationId: string,
    sortParams?: DamSortParameters,
    filters?: DamFilterParameters,
  ): Promise<Folder[]> {
    // Build query using query builder service
    let query = this.queryBuilder.buildBaseQuery(organizationId);
    query = this.queryBuilder.applyParentFilter(query, parentId);

    // Apply filters using services
    if (filters) {
      query = this.queryBuilder.applyOwnerFilter(query, filters.ownerId);
      query = FolderDateFilter.applyDateFilters(query, filters);
      
      // Check type filter - return empty if not folder type
      const typeFilterResult = this.queryBuilder.applyTypeFilter(query, filters.type);
      if (typeFilterResult === null) {
        return []; // No folders match asset-specific type filter
      }
      query = typeFilterResult;
    }

    // Apply sorting
    query = this.queryBuilder.applySorting(query, sortParams);

    const data = await this.queryExecutor.executeQuery(query, `fetching folders for parent ${parentId}`);
    const folders = data.map(raw => FolderMapper.toDomain(raw));
    
    return folders;
  }
  
  async findByName(name: string, organizationId: string, parentFolderId?: string | null): Promise<Folder | null> {
    let query = this.queryBuilder.buildBaseQuery(organizationId);
    query = this.queryBuilder.applyNameFilter(query, name);
    
    if (parentFolderId !== undefined) {
      query = this.queryBuilder.applyParentFilter(query, parentFolderId);
    }

    const data = await this.queryExecutor.executeSingleQuery(query.maybeSingle(), `fetching folder by name ${name}`);
    
    if (!data) {
      return null;
    }
    return FolderMapper.toDomain(data);
  }

  async findChildren(folderId: string, organizationId: string): Promise<(Folder | Asset)[]> {
    return await this.treeService.getFolderChildren(folderId, organizationId);
  }

  async getPath(folderId: string, _organizationId: string): Promise<string> {
    return await this.treeService.getFolderPathString(folderId);
  }

  async save(folderData: CreateFolderData): Promise<Folder> {
    return this.create(folderData);
  }

  async update(id: string, updates: UpdateFolderData, organizationId: string): Promise<Folder> {
    const updatedData = await this.queryExecutor.executeUpdate(id, updates, organizationId);
    
    if (updatedData === null) {
      // No update needed, return existing
      const existing = await this.findById(id, organizationId);
      if (!existing) {
        throw new ValidationError('Folder not found for update.');
      }
      return existing;
    }
    
    return FolderMapper.toDomain(updatedData);
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.queryExecutor.executeDelete(id, organizationId);
  }

  async getFolderTree(organizationId: string, parentFolderId?: string | null): Promise<FolderTreeNode[]> {
    return await this.treeService.buildFolderTree(organizationId, parentFolderId);
  }

  async findFolderPath(folderId: string, organizationId: string): Promise<Folder[]> {
    if (!folderId) {
      throw new ValidationError('Folder ID is required to find folder path.');
    }
    if (!organizationId) {
      throw new ValidationError('Organization ID is required to find folder path.');
    }

    return await this.treeService.getFolderPathArray(folderId);
  }

  async findAllByOrganizationId(organizationId: string): Promise<Folder[]> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required to list all folders.');
    }

    const query = this.queryBuilder.buildBaseQuery(organizationId).order('name', { ascending: true });
    const data = await this.queryExecutor.executeQuery(query, 'fetching all folders for organization');
    return data.map(raw => FolderMapper.toDomain(raw));
  }

  async create(folderData: CreateFolderData): Promise<Folder> {
    const data = await this.queryExecutor.executeCreate(folderData);
    return FolderMapper.toDomain(data);
  }

  async search(
    organizationId: string, 
    searchQuery: string, 
    currentFolderIdForContext?: string | null, 
    limitOptions?: { offset?: number; limit?: number }, 
    sortParams?: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<Folder[]> {
    // Build query using query builder service
    let query = this.queryBuilder.buildBaseQuery(organizationId);
    query = this.queryBuilder.applySearchFilter(query, searchQuery);

    // Apply parent folder context if specified
    if (currentFolderIdForContext !== undefined) {
      query = this.queryBuilder.applyParentFilter(query, currentFolderIdForContext);
    }

    // Apply sorting and pagination
    query = this.queryBuilder.applySorting(query, sortParams);
    query = this.queryBuilder.applyPagination(query, limitOptions);

    const data = await this.queryExecutor.executeQuery(query, 'searching folders');
    const result = data.map(raw => FolderMapper.toDomain(raw));
    
    return result;
  }
} 
