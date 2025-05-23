'use server';

import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { Tag } from '@/lib/dam/domain/entities/Tag'; // Import domain entity
import { SupabaseTagRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseTagRepository';
import { CreateTagUseCase } from '@/lib/dam/application/use-cases/CreateTagUseCase';
import { ListTagsUseCase } from '@/lib/dam/application/use-cases/ListTagsUseCase';
import { AppError } from '@/lib/errors/base';
import type { SupabaseClient, User } from '@supabase/supabase-js';

// Re-export the Tag type
export type { Tag };

// Plain Tag interface for client component serialization
export interface PlainTag {
  id: string;
  name: string;
  userId: string;
  organizationId: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Helper to convert Tag domain entity to plain object
function tagToPlainObject(tag: Tag): PlainTag {
  return tag.toPlainObject();
}

// Action result type
export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

// --- Start: Executor Pattern ---

// Internal helper for authentication and organization ID retrieval
async function getAuthenticatedUserAndOrgInternal(
  supabaseClient: SupabaseClient
): Promise<{ user?: User; userId?: string; activeOrgId?: string; error?: string }> {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    return { error: 'User not authenticated' };
  }
  const activeOrgId = await getActiveOrganizationId();
  if (!activeOrgId) {
    return { error: 'Active organization not found.' };
  }
  return { user, userId: user.id, activeOrgId };
}

// Arguments for the core logic function of an action
interface TagActionCoreLogicArgs<TParams, TData> {
  supabase: SupabaseClient;
  activeOrgId: string;
  userId: string;
  user: User;
  params: TParams;
}

// Configuration for the tag action executor
interface TagActionConfig<TParams, TData> {
  actionName: string;
  params: TParams;
  validateParams: (params: TParams) => string | undefined; // Returns error message if invalid
  executeCoreLogic: (args: TagActionCoreLogicArgs<TParams, TData>) => Promise<ActionResult<TData>>;
}

// Tag Action Executor
async function executeTagAction<TParams, TData>(
  config: TagActionConfig<TParams, TData>
): Promise<ActionResult<TData>> {
  const validationError = config.validateParams(config.params);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const supabase = createSupabaseServerClient();
  try {
    const authResult = await getAuthenticatedUserAndOrgInternal(supabase);
    if (authResult.error || !authResult.activeOrgId || !authResult.userId || !authResult.user) {
      return { success: false, error: authResult.error || 'Authentication or organization check failed.' };
    }

    return await config.executeCoreLogic({
      supabase,
      activeOrgId: authResult.activeOrgId,
      userId: authResult.userId,
      user: authResult.user,
      params: config.params,
    });

  } catch (err: any) {
    console.error(`${config.actionName} (Tag Action Executor): Unexpected error`, err.message, err.stack);
    if (err instanceof AppError) {
      return { success: false, error: err.message, errorCode: err.code };
    }
    return { success: false, error: `An unexpected error occurred in ${config.actionName}.` };
  }
}

// --- End: Executor Pattern ---

/**
 * Creates a new tag for the active organization.
 */
export async function createTag(
  formData: FormData,
): Promise<ActionResult<Tag>> {
  const name = formData.get('name') as string;

  return executeTagAction({
    actionName: 'createTag',
    params: { name },
    validateParams: ({ name }) => {
      if (!name || name.trim() === '') {
        return 'Tag name cannot be empty.';
      }
      return undefined;
    },
    executeCoreLogic: async ({ supabase, activeOrgId, userId, params }) => {
      try {
        const tagRepository = new SupabaseTagRepository(supabase);
        const createTagUseCase = new CreateTagUseCase(tagRepository);

        const newTag = await createTagUseCase.execute({
          name: params.name,
          userId: userId,
          organizationId: activeOrgId,
        });

        return { success: true, data: newTag };
      } catch (error: any) {
        console.error('createTag: Use Case Error', error);
        if (error instanceof AppError) {
          return { success: false, error: error.message, errorCode: error.code };
        }
        return { success: false, error: error.message || 'Failed to create tag.' };
      }
    },
  });
}

/**
 * Lists tags for a given organization that are currently in use.
 */
export async function listTagsForOrganization(
  organizationId: string,
): Promise<ActionResult<Tag[]>> {
  return executeTagAction({
    actionName: 'listTagsForOrganization',
    params: { organizationId },
    validateParams: ({ organizationId }) => {
      if (!organizationId) {
        return 'Organization ID is required.';
      }
      return undefined;
    },
    executeCoreLogic: async ({ supabase, params }) => {
      try {
        const tagRepository = new SupabaseTagRepository(supabase);
        const listTagsUseCase = new ListTagsUseCase(tagRepository);

        const tags = await listTagsUseCase.execute({ 
          organizationId: params.organizationId,
          includeOrphaned: false // Only list tags that are in use
        });

        return { success: true, data: tags };
      } catch (error: any) {
        console.error('listTagsForOrganization: Use Case Error', error);
        if (error instanceof AppError) {
          return { success: false, error: error.message, errorCode: error.code };
        }
        return { success: false, error: error.message || 'Failed to list tags.' };
      }
    },
  });
}

/**
 * Lists ALL tags for a given organization, including orphaned ones.
 */
export async function getAllTagsForOrganizationInternal(
  organizationId: string,
): Promise<ActionResult<Tag[]>> {
  return executeTagAction({
    actionName: 'getAllTagsForOrganizationInternal',
    params: { organizationId },
    validateParams: ({ organizationId }) => {
      if (!organizationId) {
        return 'Organization ID is required.';
      }
      return undefined;
    },
    executeCoreLogic: async ({ supabase, params }) => {
      try {
        const tagRepository = new SupabaseTagRepository(supabase);
        const listTagsUseCase = new ListTagsUseCase(tagRepository);

        const tags = await listTagsUseCase.execute({ 
          organizationId: params.organizationId,
          includeOrphaned: true // List all tags, including orphaned
        });

        return { success: true, data: tags };
      } catch (error: any) {
        console.error('getAllTagsForOrganizationInternal: Use Case Error', error);
        if (error instanceof AppError) {
          return { success: false, error: error.message, errorCode: error.code };
        }
        return { success: false, error: error.message || 'Failed to list all tags.' };
      }
    },
  });
}

// --- CLIENT-SAFE VERSIONS (Return Plain Objects) ---

/**
 * Client-safe version of createTag that returns a PlainTag instead of Tag domain entity
 */
export async function createTagForClient(
  formData: FormData,
): Promise<ActionResult<PlainTag>> {
  const result = await createTag(formData);
  if (result.success && result.data) {
    return { success: true, data: tagToPlainObject(result.data) };
  }
  return { success: false, error: result.error, errorCode: result.errorCode };
}

/**
 * Client-safe version of listTagsForOrganization that returns PlainTag[] instead of Tag[]
 */
export async function listTagsForOrganizationForClient(
  organizationId: string,
): Promise<ActionResult<PlainTag[]>> {
  const result = await listTagsForOrganization(organizationId);
  if (result.success && result.data) {
    return { success: true, data: result.data.map(tagToPlainObject) };
  }
  return { success: false, error: result.error, errorCode: result.errorCode };
}

/**
 * Client-safe version of getAllTagsForOrganizationInternal that returns PlainTag[] instead of Tag[]
 */
export async function getAllTagsForOrganizationInternalForClient(
  organizationId: string,
): Promise<ActionResult<PlainTag[]>> {
  const result = await getAllTagsForOrganizationInternal(organizationId);
  if (result.success && result.data) {
    return { success: true, data: result.data.map(tagToPlainObject) };
  }
  return { success: false, error: result.error, errorCode: result.errorCode };
} 