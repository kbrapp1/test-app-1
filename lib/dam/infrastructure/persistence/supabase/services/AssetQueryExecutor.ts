import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseError } from '@/lib/errors/base';
import { Asset } from '../../../../domain/entities/Asset';
import { AssetMapper } from '../mappers/AssetMapper';
import { CreateAssetData, UpdateAssetData } from '../../../../domain/repositories/IAssetRepository';
import * as crypto from 'crypto';

type SupabaseQueryBuilder = ReturnType<ReturnType<SupabaseClient['from']>['select']>;
type RawAssetDbRecord = Record<string, unknown>;

/**
 * Asset Query Executor Service
 * Follows Single Responsibility Principle - handles query execution and error handling
 */
export class AssetQueryExecutor {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Execute findById query
   */
  async executeFindById(id: string): Promise<RawAssetDbRecord | null> {
    const { data, error } = await this.supabase
      .from('assets')
      .select('*, folder:folders(name), asset_tags(tags(*))')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching asset by ID:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Execute query and handle errors
   */
  async executeQuery(query: SupabaseQueryBuilder, errorContext: string): Promise<RawAssetDbRecord[]> {
    const { data, error } = await query;
    
    if (error) {
      console.error(`Error ${errorContext}:`, error);
      throw new DatabaseError(`Failed to ${errorContext}.`, error.message);
    }
    
    return (data as RawAssetDbRecord[]) || [];
  }

  /**
   * Execute query with simple error handling (returns empty array on error)
   */
  async executeQuerySafe(query: SupabaseQueryBuilder, errorContext: string): Promise<RawAssetDbRecord[]> {
    const { data, error } = await query;
    
    if (error) {
      console.error(`Error ${errorContext}:`, error);
      return [];
    }
    
    return (data as RawAssetDbRecord[]) || [];
  }

  /**
   * Execute save operation
   */
  async executeSave(assetData: CreateAssetData): Promise<any> {
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
      const errorMessage = error?.message || 'Unknown database error';
      throw new DatabaseError(`Could not save asset: ${errorMessage}`, error?.code || 'SAVE_ASSET_ERROR');
    }

    return data;
  }

  /**
   * Execute update operation
   */
  async executeUpdate(assetId: string, updateData: UpdateAssetData): Promise<Record<string, unknown> | null> {
    const persistenceData: {
      name?: string;
      folder_id?: string | null;
      storage_path?: string;
      mime_type?: string;
      size?: number;
      updated_at?: string;
    } = {};
    if (updateData.name !== undefined) persistenceData.name = updateData.name;
    if (updateData.folderId !== undefined) persistenceData.folder_id = updateData.folderId;
    if (updateData.storagePath !== undefined) persistenceData.storage_path = updateData.storagePath;
    if (updateData.mimeType !== undefined) persistenceData.mime_type = updateData.mimeType;
    if (updateData.size !== undefined) persistenceData.size = updateData.size;

    const { data, error } = await this.supabase
      .from('assets')
      .update(persistenceData)
      .eq('id', assetId)
      .select('*, asset_tags(tags(*))')
      .single();

    if (error) {
      console.error(`Error updating asset ${assetId}:`, error);
      return null;
    }
    
    return data;
  }

  /**
   * Execute delete operation
   */
  async executeDelete(id: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('assets')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error(`Error deleting asset ${id}:`, error);
      return false;
    }
    
    // Check if any rows were actually deleted
    const deletedCount = data ? data.length : 0;
    return deletedCount > 0;
  }

  /**
   * Execute get storage path operation
   */
  async executeGetStoragePath(assetId: string): Promise<string | null> {
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
} 
