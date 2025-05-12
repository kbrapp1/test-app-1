import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { createClient as createSupabaseUserClient } from '@/lib/supabase/server';
import { saveAsNewTextAssetService } from '@/lib/services/asset-service';
import { AppError } from '@/lib/errors/base';
import { ErrorCodes } from '@/lib/errors/constants';

interface SaveAsNewTextAssetUsecaseParams {
  content: string;
  desiredName: string;
  folderId?: string | null;
}

interface SaveAsNewTextAssetUsecaseResult {
  success: boolean;
  newAssetId?: string;
  error?: string;
  errorCode?: string;
}

export async function saveAsNewTextAssetUsecase(
  params: SaveAsNewTextAssetUsecaseParams
): Promise<SaveAsNewTextAssetUsecaseResult> {
  const { content, desiredName, folderId } = params;

  if (!content) {
    return { success: false, error: 'Content is required.', errorCode: ErrorCodes.VALIDATION_ERROR };
  }
  if (!desiredName || desiredName.trim() === '') {
    return { success: false, error: 'Desired name cannot be empty.', errorCode: ErrorCodes.VALIDATION_ERROR };
  }

  const supabaseAuthClient = createSupabaseUserClient();
  let userId: string;
  let organizationId: string;

  try {
    const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'User not authenticated.', errorCode: ErrorCodes.UNAUTHORIZED };
    }
    userId = user.id;

    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      return { success: false, error: 'Active organization not found.', errorCode: ErrorCodes.RESOURCE_NOT_FOUND };
    }
    organizationId = activeOrgId;
  } catch (authError) {
    console.error('saveAsNewTextAssetUsecase: Authentication or Organization fetch error', authError);
    return { success: false, error: 'Failed to authenticate or retrieve organization.', errorCode: ErrorCodes.UNEXPECTED_ERROR };
  }

  try {
    const serviceResult = await saveAsNewTextAssetService(
      userId,
      organizationId,
      content,
      desiredName,
      folderId
    );

    if (!serviceResult.success || !serviceResult.data?.newAssetId) {
      return {
        success: false,
        error: serviceResult.error || 'Failed to save new text asset via service.',
        errorCode: serviceResult.errorCode || ErrorCodes.UNEXPECTED_ERROR,
      };
    }

    return { success: true, newAssetId: serviceResult.data.newAssetId };
  } catch (error: any) {
    console.error('saveAsNewTextAssetUsecase: Unexpected error', error);
    if (error instanceof AppError) {
      return { success: false, error: error.message, errorCode: error.code };
    }
    return { success: false, error: 'An unexpected error occurred.', errorCode: ErrorCodes.UNEXPECTED_ERROR };
  }
} 