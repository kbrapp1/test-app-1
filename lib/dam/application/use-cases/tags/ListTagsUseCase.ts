import { Tag } from '@/lib/dam/domain/entities/Tag';
import { ITagRepository } from '@/lib/dam/domain/repositories/ITagRepository';
import { AppError, ValidationError } from '@/lib/errors/base';

interface ListTagsInput {
  organizationId: string;
  includeOrphaned?: boolean; // If true, lists all tags; if false or undefined, lists only used tags.
}

export class ListTagsUseCase {
  constructor(private tagRepository: ITagRepository) {}

  async execute(input: ListTagsInput): Promise<Tag[]> {
    if (!input.organizationId) {
      throw new ValidationError('Organization ID is required to list tags.', 'ORG_ID_REQUIRED');
    }

    try {
      // The includeOrphaned flag defaults to true in the repository if not provided
      const tags = await this.tagRepository.findByOrganizationId(input.organizationId, input.includeOrphaned);
      return tags;
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('ListTagsUseCase - Unexpected error:', error);
      throw new AppError('An unexpected error occurred while listing tags.', 'LIST_TAGS_UNEXPECTED_ERROR');
    }
  }
} 
