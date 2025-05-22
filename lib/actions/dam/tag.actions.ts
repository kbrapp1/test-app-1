'use server';

import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { Tag } from '@/lib/dam/domain/entities/Tag'; // Import domain entity
import { SupabaseTagRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseTagRepository';
import { CreateTagUseCase } from '@/lib/dam/application/use-cases/CreateTagUseCase';
import { ListTagsUseCase } from '@/lib/dam/application/use-cases/ListTagsUseCase';
import { AppError } from '@/lib/errors/base';

// Re-export the Tag type
export type { Tag };

// Local ActionResult type, can be generalized if used elsewhere
export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string; // To pass specific error codes from AppError
}

/**
 * Creates a new tag for the active organization.
 */
export async function createTag(
  formData: FormData,
): Promise<ActionResult<Tag>> {
  const name = formData.get('name') as string;

  try {
    const supabase = createSupabaseServerClient(); // For auth and repository
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'User not authenticated.', errorCode: 'USER_NOT_AUTHENTICATED' };
    }

    const organizationId = await getActiveOrganizationId();
    if (!organizationId) {
      return { success: false, error: 'Could not determine active organization.', errorCode: 'NO_ACTIVE_ORG' };
    }

    const tagRepository = new SupabaseTagRepository(supabase);
    const createTagUseCase = new CreateTagUseCase(tagRepository);

    const newTag = await createTagUseCase.execute({
      name: name, // name is already trimmed by use case if needed
      userId: user.id,
      organizationId: organizationId,
    });

    return { success: true, data: newTag };

  } catch (e: any) {
    console.error('Error creating tag (action):', e);
    if (e instanceof AppError) {
      return { success: false, error: e.message, errorCode: e.code };
    }
    return { success: false, error: 'An unexpected error occurred while creating the tag.', errorCode: 'UNEXPECTED_ACTION_ERROR' };
  }
}

/**
 * Lists tags for a given organization that are currently in use.
 */
export async function listTagsForOrganization(
  organizationId: string,
): Promise<ActionResult<Tag[]>> {
  if (!organizationId) {
    return { success: false, error: 'Organization ID is required.', errorCode: 'ORG_ID_REQUIRED' };
  }

  try {
    const supabase = createSupabaseServerClient();
    const tagRepository = new SupabaseTagRepository(supabase);
    const listTagsUseCase = new ListTagsUseCase(tagRepository);

    const tags = await listTagsUseCase.execute({ 
      organizationId,
      includeOrphaned: false // Only list tags that are in use
    });

    return { success: true, data: tags };

  } catch (e: any) {
    console.error('Error listing tags (action):', e);
    if (e instanceof AppError) {
      return { success: false, error: e.message, errorCode: e.code };
    }
    return { success: false, error: 'An unexpected error occurred while listing tags.', errorCode: 'UNEXPECTED_ACTION_ERROR' };
  }
}

/**
 * Lists ALL tags for a given organization, including orphaned ones.
 */
export async function getAllTagsForOrganizationInternal(
  organizationId: string,
): Promise<ActionResult<Tag[]>> {
  if (!organizationId) {
    return { success: false, error: 'Organization ID is required.', errorCode: 'ORG_ID_REQUIRED' };
  }
  
  try {
    const supabase = createSupabaseServerClient();
    const tagRepository = new SupabaseTagRepository(supabase);
    const listTagsUseCase = new ListTagsUseCase(tagRepository);

    const tags = await listTagsUseCase.execute({ 
      organizationId,
      includeOrphaned: true // List all tags, including orphaned
    });

    return { success: true, data: tags };

  } catch (e: any) {
    console.error('Error listing all internal tags (action):', e);
    if (e instanceof AppError) {
      return { success: false, error: e.message, errorCode: e.code };
    }
    return { success: false, error: 'An unexpected error occurred while listing all internal tags.', errorCode: 'UNEXPECTED_ACTION_ERROR' };
  }
} 