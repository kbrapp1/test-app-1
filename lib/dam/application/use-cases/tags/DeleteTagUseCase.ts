import { ITagRepository } from '@/lib/dam/domain/repositories/ITagRepository';
import { IAssetTagRepository } from '@/lib/dam/domain/repositories/IAssetTagRepository';
import { AppError, ConflictError, NotFoundError, ValidationError, DatabaseError } from '@/lib/errors/base';

interface DeleteTagUseCaseParams {
  tagId: string;
  organizationId: string;
  // userId?: string; // For audit logging if needed
}

export class DeleteTagUseCase {
  constructor(
    private readonly tagRepository: ITagRepository,
    private readonly assetTagRepository: IAssetTagRepository
  ) {}

  async execute(params: DeleteTagUseCaseParams): Promise<boolean> {
    const { tagId, organizationId } = params;

    // 1. Validate input
    if (!tagId) {
      throw new ValidationError('Tag ID is required.');
    }
    if (!organizationId) {
      throw new ValidationError('Organization ID is required.');
    }

    // 2. Verify tag exists and belongs to the specified organization
    const existingTag = await this.tagRepository.findById(tagId);
    if (!existingTag) {
      throw new NotFoundError(`Tag with ID ${tagId} not found.`);
    }
    if (existingTag.organizationId !== organizationId) {
      throw new NotFoundError(`Tag with ID ${tagId} not found in this organization.`);
    }

    // 3. Check if the tag is linked to any assets
    const isLinked = await this.assetTagRepository.isTagLinked(tagId, organizationId);
    if (isLinked) {
      throw new ConflictError(
        `Tag "${existingTag.name}" cannot be deleted because it is currently linked to one or more assets.`,
        'TAG_IN_USE',
        { tagId: existingTag.id, tagName: existingTag.name }
      );
    }

    // 4. Delete the tag
    try {
      // ITagRepository needs a delete method
      const success = await this.tagRepository.delete(tagId);
      if (!success) {
        // This might occur if RLS prevents deletion or row is already gone (though findById should catch that).
        // Or if the repository's delete method has other reasons to return false without throwing.
        throw new DatabaseError(`Failed to delete tag "${existingTag.name}" for an unspecified reason.`);
      }
      return true;
    } catch (error: unknown) {
      if (error instanceof AppError) { // Re-throw known AppErrors (like ConflictError from above)
        throw error;
      }
      console.error('DeleteTagUseCase - Unexpected error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError('An unexpected error occurred while deleting the tag.', errorMessage);
    }
  }
}
 
