import { PlainTag } from '../../../application/dto/DamApiRequestDto';
import { ListTagsUseCase } from '../../../application/use-cases/tags/ListTagsUseCase';
import { CreateTagUseCase } from '../../../application/use-cases/tags/CreateTagUseCase';
import { AddTagToAssetUseCase } from '../../../application/use-cases/tags/AddTagToAssetUseCase';
import { SupabaseTagRepository } from '../../../infrastructure/persistence/supabase/SupabaseTagRepository';
import { SupabaseAssetRepository } from '../../../infrastructure/persistence/supabase/SupabaseAssetRepository';
import { SupabaseAssetTagRepository } from '../../../infrastructure/persistence/supabase/SupabaseAssetTagRepository';
import { TagEditorAuthService } from './TagEditorAuthService';

/**
 * Service responsible for tag data operations using DDD use cases
 * Handles tag fetching, creation, and asset association
 */
export class TagEditorDataService {
  private authService: TagEditorAuthService;

  constructor() {
    this.authService = new TagEditorAuthService();
  }

  /**
   * Fetches all organization tags and used tags
   */
  async fetchTagsData(organizationId: string): Promise<{
    allTags: PlainTag[];
    usedTags: PlainTag[];
  }> {
    const { supabase } = await this.authService.getAuthContext();
    const tagRepository = new SupabaseTagRepository(supabase);
    const listTagsUseCase = new ListTagsUseCase(tagRepository);

    // Get all tags for organization (includeOrphaned = true)
    const allTagsEntities = await listTagsUseCase.execute({
      organizationId,
      includeOrphaned: true,
    });

    // Get only used tags (includeOrphaned = false)
    const usedTagsEntities = await listTagsUseCase.execute({
      organizationId,
      includeOrphaned: false,
    });

    // Convert domain entities to PlainTag DTOs
    const allTags: PlainTag[] = allTagsEntities.map((tag: any) => ({
      id: tag.id,
      name: tag.name,
      color: tag.colorName,
      userId: tag.userId,
      organizationId: tag.organizationId,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    }));

    const usedTags: PlainTag[] = usedTagsEntities.map((tag: any) => ({
      id: tag.id,
      name: tag.name,
      color: tag.colorName,
      userId: tag.userId,
      organizationId: tag.organizationId,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    }));

    return { allTags, usedTags };
  }

  /**
   * Creates a new tag using DDD use case
   */
  async createTag(tagName: string): Promise<PlainTag> {
    const { supabase, user, activeOrgId } = await this.authService.getAuthContext();
    const tagRepository = new SupabaseTagRepository(supabase);
    const createTagUseCase = new CreateTagUseCase(tagRepository);

    const newTagEntity = await createTagUseCase.execute({
      name: tagName,
      userId: user.id,
      organizationId: activeOrgId,
    });

    // Convert domain entity to PlainTag DTO
    return {
      id: newTagEntity.id,
      name: newTagEntity.name,
      color: newTagEntity.colorName,
      userId: newTagEntity.userId,
      organizationId: newTagEntity.organizationId,
      createdAt: newTagEntity.createdAt,
      updatedAt: newTagEntity.updatedAt,
    };
  }

  /**
   * Adds a tag to an asset using DDD use case
   */
  async addTagToAsset(assetId: string, tagId: string): Promise<void> {
    const { supabase, user, activeOrgId } = await this.authService.getAuthContext();
    const assetRepository = new SupabaseAssetRepository(supabase);
    const tagRepository = new SupabaseTagRepository(supabase);
    const assetTagRepository = new SupabaseAssetTagRepository(supabase);
    const addTagUseCase = new AddTagToAssetUseCase(assetRepository, tagRepository, assetTagRepository);

    await addTagUseCase.execute({
      assetId,
      tagId,
      organizationId: activeOrgId,
      userId: user.id,
    });
  }
} 
