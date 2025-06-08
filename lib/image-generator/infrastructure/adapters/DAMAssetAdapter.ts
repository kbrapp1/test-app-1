// DAM Asset Adapter - DDD Infrastructure Layer
// Single Responsibility: Implement DAM asset repository interface with Supabase-specific logic
// Following Golden Rule: Infrastructure implements application interfaces

import { SupabaseAssetRepository } from '../../../dam/infrastructure/persistence/supabase/SupabaseAssetRepository';
import { createClient } from '../../../supabase/client';
import { IDAMAssetRepository } from '../../application/services/DAMIntegrationService';
import { SaveAssetToDAMDto, DAMAssetDto } from '../../application/dto/DAMIntegrationDto';

/**
 * DAM Asset Adapter
 * Implements application interface using existing DAM infrastructure
 * Following Golden Rule: Keep implementation focused and under 250 lines
 */
export class DAMAssetAdapter implements IDAMAssetRepository {
  private assetRepository: SupabaseAssetRepository;

  constructor() {
    const supabase = createClient();
    this.assetRepository = new SupabaseAssetRepository(supabase);
  }

  async save(assetDto: SaveAssetToDAMDto): Promise<DAMAssetDto> {
    try {
      const savedAsset = await this.assetRepository.save(assetDto);
      
      return {
        id: savedAsset.id,
        userId: savedAsset.userId,
        organizationId: savedAsset.organizationId,
        name: savedAsset.name,
        storagePath: savedAsset.storagePath,
        mimeType: savedAsset.mimeType,
        size: savedAsset.size,
        folderId: savedAsset.folderId,
        createdAt: savedAsset.createdAt.toISOString(),
        updatedAt: savedAsset.updatedAt?.toISOString() || new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to save asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findById(assetId: string): Promise<DAMAssetDto | null> {
    try {
      const asset = await this.assetRepository.findById(assetId);
      if (!asset) {
        return null;
      }
      
      return {
        id: asset.id,
        userId: asset.userId,
        organizationId: asset.organizationId,
        name: asset.name,
        storagePath: asset.storagePath,
        mimeType: asset.mimeType,
        size: asset.size,
        folderId: asset.folderId,
        createdAt: asset.createdAt.toISOString(),
        updatedAt: asset.updatedAt?.toISOString() || new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to find asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteById(assetId: string): Promise<boolean> {
    try {
      return await this.assetRepository.delete(assetId);
    } catch (error) {
      throw new Error(`Failed to delete asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 