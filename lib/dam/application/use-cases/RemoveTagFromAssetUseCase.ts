import { IAssetRepository } from '../../domain/repositories/IAssetRepository';
import { ITagRepository } from '../../domain/repositories/ITagRepository';
import { IAssetTagRepository } from '../../domain/repositories/IAssetTagRepository';
import { ValidationError, NotFoundError, DatabaseError } from '@/lib/errors/base';

interface RemoveTagFromAssetUseCaseParams {
  assetId: string;
  tagId: string;
  organizationId: string;
}

export class RemoveTagFromAssetUseCase {
  constructor(
    private readonly assetRepository: IAssetRepository,
    private readonly tagRepository: ITagRepository,
    private readonly assetTagRepository: IAssetTagRepository
  ) {}

  async execute(params: RemoveTagFromAssetUseCaseParams): Promise<boolean> {
    const { assetId, tagId, organizationId } = params;

    // 1. Validate input
    if (!assetId) {
      throw new ValidationError('Asset ID is required.');
    }
    if (!tagId) {
      throw new ValidationError('Tag ID is required.');
    }
    if (!organizationId) {
      throw new ValidationError('Organization ID is required.');
    }

    // 2. Verify asset exists and belongs to the specified organization
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) {
      throw new NotFoundError(`Asset with ID ${assetId} not found.`);
    }
    if (asset.organizationId !== organizationId) {
      throw new ValidationError('Asset does not belong to the specified organization.');
    }

    // 3. Verify tag exists and belongs to the specified organization
    const tag = await this.tagRepository.findById(tagId);
    if (!tag) {
      throw new NotFoundError(`Tag with ID ${tagId} not found.`);
    }
    if (tag.organizationId !== organizationId) {
      throw new ValidationError('Tag does not belong to the specified organization.');
    }

    // 4. Unlink tag from asset
    try {
      const success = await this.assetTagRepository.unlinkTagFromAsset(
        assetId, 
        tagId,
        organizationId
      );
      return success;
    } catch (error) {
      console.error('Error unlinking tag from asset:', error);
      throw new DatabaseError('Failed to unlink tag from asset.', (error as Error).message);
    }
  }
} 