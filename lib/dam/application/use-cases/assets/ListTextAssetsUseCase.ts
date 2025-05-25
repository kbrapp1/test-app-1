import { IAssetRepository } from '../../../domain/repositories/IAssetRepository';
import { Asset } from '../../../domain/entities/Asset';
import { AppError, ValidationError, DatabaseError } from '@/lib/errors/base';

// Define text MIME types, consider moving to a shared location if used elsewhere
const TEXT_MIME_TYPES = [
  'text/plain',
  'text/markdown',
  'application/json',
  'text/html',
  'text/css',
  'text/javascript',
] as const;

// Define what a summary of a text asset should look like for the use case response
// Updated to include all required fields for Asset domain entity
export interface TextAssetSummaryDto {
  id: string;
  name: string;
  userId: string;
  storagePath: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  updatedAt?: Date;
  folderId?: string | null;
  organizationId: string;
  publicUrl?: string;
}

interface ListTextAssetsUseCaseRequest {
  organizationId: string;
}

export class ListTextAssetsUseCase {
  constructor(private assetRepository: IAssetRepository) {}

  public async execute(
    request: ListTextAssetsUseCaseRequest
  ): Promise<{ assets: TextAssetSummaryDto[] }> {
    const { organizationId } = request;

    if (!organizationId) {
      throw new ValidationError('Organization ID is required.');
    }

    try {
      // Use the search method with AssetSearchCriteria
      const assets = await this.assetRepository.search({
        organizationId,
        searchTerm: '', // No specific search query, lists all matching criteria
        folderId: undefined, // No specific folder constraint
        filters: {
          // Don't use the type filter with comma-separated values since it won't work
          // Instead, we'll filter after getting all assets
        },
      });

      // Filter assets to only include text types
      const textAssets = assets.filter(asset => 
        TEXT_MIME_TYPES.includes(asset.mimeType as any)
      );

      const assetSummaries: TextAssetSummaryDto[] = textAssets.map((asset) => {
        return {
          id: asset.id.toString(),
          name: asset.name,
          userId: asset.userId,
          storagePath: asset.storagePath,
          mimeType: asset.mimeType,
          size: asset.size,
          createdAt: asset.createdAt,
          updatedAt: asset.updatedAt,
          folderId: asset.folderId,
          organizationId: asset.organizationId,
          publicUrl: asset.publicUrl,
        };
      });

      return { assets: assetSummaries };
    } catch (error: any) {
      console.error('Error in ListTextAssetsUseCase:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError(
        'An unexpected error occurred while listing text assets.',
        'LIST_TEXT_ASSETS_FAILED',
        { originalError: error.message }
      );
    }
  }
} 
