import { IAssetRepository } from '../../domain/repositories/IAssetRepository';
import { Asset } from '../../domain/entities/Asset';
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
// This matches the old use case's TextAssetSummary
export interface TextAssetSummaryDto {
  id: string;
  name: string;
  createdAt: Date; // Asset entity has createdAt as Date
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
      // Use the search method with an empty query and specified MIME types
      const assets = await this.assetRepository.search(
        '', // No specific search query, lists all matching criteria
        organizationId,
        undefined, // No specific folder
        [...TEXT_MIME_TYPES]
      );

      const assetSummaries: TextAssetSummaryDto[] = assets.map((asset) => ({
        id: asset.id.toString(),
        name: asset.name,
        createdAt: asset.createdAt,
      }));

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