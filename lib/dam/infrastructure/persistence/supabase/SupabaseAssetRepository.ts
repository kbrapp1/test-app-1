import { SupabaseClient } from '@supabase/supabase-js';
import { IAssetRepository } from '../../../domain/repositories/IAssetRepository';
import { Asset } from '../../../domain/entities/Asset';
import { AssetMapper, RawAssetDbRecord } from './mappers/AssetMapper';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export class SupabaseAssetRepository implements IAssetRepository {
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient ?? createSupabaseServerClient();
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
    if (domainAsset.storagePath) {
      domainAsset.publicUrl = this.supabase.storage.from('assets').getPublicUrl(domainAsset.storagePath).data.publicUrl;
    }
    return domainAsset;
  }

  async findByFolderId(folderId: string | null, organizationId: string): Promise<Asset[]> {
    let query = this.supabase
      .from('assets')
      .select('*, asset_tags(tags(*))')
      .eq('organization_id', organizationId);

    if (folderId === null) {
      query = query.is('folder_id', null);
    } else {
      query = query.eq('folder_id', folderId);
    }
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error(`Error fetching assets for folder ${folderId}:`, error);
      return [];
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

  async search(queryStr: string, organizationId: string, folderId?: string | null, mimeTypes?: string[], tags?: string[]): Promise<Asset[]> {
    let query = this.supabase
      .from('assets')
      .select('*, asset_tags(tags(*))')
      .eq('organization_id', organizationId)
      .ilike('name', `%${queryStr}%`);

    if (folderId === null) {
      query = query.is('folder_id', null);
    } else if (folderId !== undefined) {
      query = query.eq('folder_id', folderId);
    }
    if (mimeTypes && mimeTypes.length) {
      query = query.in('mime_type', mimeTypes);
    }
    // TODO: implement tag filtering

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error('Error searching assets:', error);
      return [];
    }
    return (data || []).map(raw => this.mapRawToDomainWithPublicUrl(raw as unknown as RawAssetDbRecord));
  }

  async save(asset: Asset): Promise<Asset> {
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

  async update(assetId: string, data: Partial<Omit<Asset, 'id' | 'organizationId' | 'userId' | 'createdAt'>>): Promise<Asset | null> {
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
    if (domainAsset.storagePath) {
      try {
        const { data: urlData } = this.supabase.storage.from('assets').getPublicUrl(domainAsset.storagePath);
        domainAsset.publicUrl = urlData.publicUrl;
      } catch (e) {
        console.warn(`Failed to get public URL for ${domainAsset.storagePath}`, e);
        domainAsset.publicUrl = undefined; // Or a placeholder path
      }
    }
    return domainAsset;
  }
}
