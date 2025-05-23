import { Tag } from '@/lib/dam/domain/entities/Tag';
import { ITagRepository, CreateTagData } from '@/lib/dam/domain/repositories/ITagRepository';
import { AppError, ConflictError, ValidationError } from '@/lib/errors/base';
// import { Usecase } from '@/lib/usecases/usecase.interface'; // Removed

interface CreateTagInput {
  name: string;
  userId: string;
  organizationId: string;
}

export class CreateTagUseCase { // Removed implements Usecase<CreateTagInput, Tag>
  constructor(private tagRepository: ITagRepository) {}

  async execute(input: CreateTagInput): Promise<Tag> {
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError('Tag name cannot be empty.', 'TAG_NAME_EMPTY');
    }
    if (!input.userId) {
      throw new ValidationError('User ID is required to create a tag.', 'USER_ID_REQUIRED');
    }
    if (!input.organizationId) {
      throw new ValidationError('Organization ID is required to create a tag.', 'ORG_ID_REQUIRED');
    }

    const trimmedName = input.name.trim();

    // Check for existing tag with the same name in the organization
    const existingTag = await this.tagRepository.findByNameAndOrganization(trimmedName, input.organizationId);
    if (existingTag) {
      throw new ConflictError(
        `A tag with the name "${trimmedName}" already exists in this organization.`,
        'DUPLICATE_TAG_NAME',
        { conflictingName: trimmedName, organizationId: input.organizationId }
      );
    }

    try {
      // Use plain data object for repository
      const tagData: CreateTagData = {
        name: trimmedName,
        userId: input.userId,
        organizationId: input.organizationId,
      };
      
      const newTag = await this.tagRepository.save(tagData);
      return newTag;
    } catch (error: any) {
      if (error instanceof AppError) { // Re-throw known AppErrors
        throw error;
      }
      console.error('CreateTagUseCase - Unexpected error:', error);
      throw new AppError('An unexpected error occurred while creating the tag.', 'CREATE_TAG_UNEXPECTED_ERROR');
    }
  }
} 