import { IAssetRepository } from '../../domain/repositories/IAssetRepository';
import { ITagRepository } from '../../domain/repositories/ITagRepository';
import { IAssetTagRepository } from '../../domain/repositories/IAssetTagRepository';
import { ValidationError, NotFoundError, DatabaseError } from '@/lib/errors/base';

interface AddTagToAssetUseCaseParams {
  assetId: string;
  tagId: string;
  organizationId: string;
  userId: string; // User performing the action
}

export class AddTagToAssetUseCase {
  constructor(
    private readonly assetRepository: IAssetRepository,
    private readonly tagRepository: ITagRepository,
    private readonly assetTagRepository: IAssetTagRepository
  ) {}

  async execute(params: AddTagToAssetUseCaseParams): Promise<boolean> {
    const { assetId, tagId, organizationId, userId } = params;

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
    if (!userId) {
      throw new ValidationError('User ID is required for this operation.');
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

    // 4. Link tag to asset
    try {
      const success = await this.assetTagRepository.linkTagToAsset(
        assetId, 
        tagId, 
        organizationId, 
        userId
      );
      return success;
    } catch (error) {
      // If the error is due to a duplicate/existing link, we might want to handle that specifically
      // For now, assuming any error is a database issue
      console.error('Error linking tag to asset:', error);
      throw new DatabaseError('Failed to link tag to asset.', (error as Error).message);
    }
  }
} 