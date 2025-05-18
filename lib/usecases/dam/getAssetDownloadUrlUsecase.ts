import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { createClient as createSupabaseUserClient } from '@/lib/supabase/server';
import { getAssetDownloadUrlService } from '@/lib/services/asset-core.service';
import { AppError } from '@/lib/errors/base';
import { ErrorCodes } from '@/lib/errors/constants';

interface GetAssetDownloadUrlUsecaseParams {
  assetId: string;
}

interface GetAssetDownloadUrlUsecaseResult {
  success: boolean;
  downloadUrl?: string;
  error?: string;
  errorCode?: string;
}

export async function getAssetDownloadUrlUsecase(
  params: GetAssetDownloadUrlUsecaseParams
): Promise<GetAssetDownloadUrlUsecaseResult> {
  const { assetId } = params;

  if (!assetId) {
    return { success: false, error: 'Asset ID is required.', errorCode: ErrorCodes.VALIDATION_ERROR };
  }

  const supabaseAuthClient = createSupabaseUserClient();
  let organizationId: string;

  try {
    // Ensure user is authenticated first, though service/repo will enforce RLS.
    const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'User not authenticated.', errorCode: ErrorCodes.UNAUTHORIZED };
    }

    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      return { success: false, error: 'Active organization not found.', errorCode: ErrorCodes.RESOURCE_NOT_FOUND };
    }
    organizationId = activeOrgId;
  } catch (authError) {
    console.error('getAssetDownloadUrlUsecase: Authentication or Organization fetch error', authError);
    return { success: false, error: 'Failed to authenticate or retrieve organization.', errorCode: ErrorCodes.UNEXPECTED_ERROR };
  }

  try {
    const serviceResult = await getAssetDownloadUrlService(organizationId, assetId);

    if (!serviceResult.success || !serviceResult.data?.downloadUrl) {
      return {
        success: false,
        error: serviceResult.error || 'Failed to get asset download URL via service.',
        errorCode: serviceResult.errorCode || ErrorCodes.UNEXPECTED_ERROR,
      };
    }

    return { success: true, downloadUrl: serviceResult.data.downloadUrl };
  } catch (error: any) {
    console.error('getAssetDownloadUrlUsecase: Unexpected error', error);
    if (error instanceof AppError) {
      return { success: false, error: error.message, errorCode: error.code };
    }
    return { success: false, error: 'An unexpected error occurred.', errorCode: ErrorCodes.UNEXPECTED_ERROR };
  }
} 