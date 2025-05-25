import { Tag } from '@/lib/dam/domain/entities/Tag';
import { ITagRepository } from '@/lib/dam/domain/repositories/ITagRepository';
import { AppError, ConflictError, NotFoundError, ValidationError, DatabaseError } from '@/lib/errors/base';

interface UpdateTagUseCaseParams {
  tagId: string;
  newName: string;
  organizationId: string;
  // userId?: string; // For audit logging if needed
}

export class UpdateTagUseCase {
  constructor(private readonly tagRepository: ITagRepository) {}

  async execute(params: UpdateTagUseCaseParams): Promise<Tag> {
    const { tagId, newName, organizationId } = params;

    // 1. Validate input
    if (!tagId) {
      throw new ValidationError('Tag ID is required.');
    }
    if (!newName || newName.trim().length === 0) {
      throw new ValidationError('New tag name cannot be empty.');
    }
    if (!organizationId) {
      throw new ValidationError('Organization ID is required.');
    }

    const trimmedNewName = newName.trim();

    // 2. Verify tag exists and belongs to the specified organization
    const existingTag = await this.tagRepository.findById(tagId);
    if (!existingTag) {
      throw new NotFoundError(`Tag with ID ${tagId} not found.`);
    }
    if (existingTag.organizationId !== organizationId) {
      throw new NotFoundError(`Tag with ID ${tagId} not found in this organization.`);
    }

    // 3. Check if the name is actually changing
    if (existingTag.name === trimmedNewName) {
      return existingTag; // No change needed
    }

    // 4. Check for duplicate names in the same organization
    const conflictingTag = await this.tagRepository.findByNameAndOrganization(trimmedNewName, organizationId);
    if (conflictingTag && conflictingTag.id !== tagId) {
      throw new ConflictError(
        `A tag with the name "${trimmedNewName}" already exists in this organization.`,
        'DUPLICATE_TAG_NAME',
        { conflictingName: trimmedNewName, organizationId }
      );
    }

    // 5. Update the tag name
    try {
      const updatedTag = await this.tagRepository.update(tagId, { name: trimmedNewName });
      if (!updatedTag) {
         // This might occur if RLS prevents update or row is gone, though findById should catch non-existence.
        throw new DatabaseError(`Failed to update tag with ID ${tagId}.`);
      }
      return updatedTag;
    } catch (error: any) {
      if (error instanceof AppError) { // Re-throw known AppErrors
        throw error;
      }
      console.error('UpdateTagUseCase - Unexpected error:', error);
      // Ensure DatabaseError is imported or handle this more generally
      throw new AppError('An unexpected error occurred while updating the tag.', 'UPDATE_TAG_UNEXPECTED_ERROR');
    }
  }
} 
