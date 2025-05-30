/**
 * Application Service: Bulk Operation Handler
 * 
 * Single Responsibility: Handles bulk operations (move, delete, tag, download)
 * Orchestrates bulk operations with proper revalidation following DDD principles
 */

import { revalidatePath } from 'next/cache';
import { AuthenticationService } from '../services/AuthenticationService';
import { FormDataExtractionService } from '../services/FormDataExtractionService';
import { RepositoryFactoryService } from '../services/RepositoryFactoryService';
import type { ActionResult, DownloadActionResult } from '../types';

export class BulkOperationHandler {
  /**
   * Handles bulk move operations
   * @param formData - Form data containing move parameters
   * @returns Promise resolving to action result
   */
  static async handleBulkMove(formData: FormData): Promise<ActionResult> {
    try {
      // 1. Get authenticated context
      const context = await AuthenticationService.getAuthenticatedContext();

      // 2. Extract and validate form data
      const extractionResult = FormDataExtractionService.extractBulkMove(formData, {
        userId: context.user.id,
        organizationId: context.organizationId
      });

      if (!extractionResult.isValid) {
        return { 
          success: false, 
          error: extractionResult.errors.join(', ') 
        };
      }

      const request = extractionResult.data!;

      // 3. Create use case and execute
      const supabase = AuthenticationService.createSupabaseClient();
      const factory = new RepositoryFactoryService(supabase);
      const useCase = factory.createBulkMoveUseCase();

      await useCase.execute({
        assetIds: request.assetIds,
        folderIds: request.folderIds,
        targetFolderId: request.targetFolderId,
        organizationId: request.organizationId,
        userId: request.userId
      });

      // 4. Revalidate DAM pages - removed for client-side fetching
      // revalidatePath('/(protected)/dam', 'layout'); // REMOVED - causes unnecessary POST /dam calls

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bulk move failed'
      };
    }
  }

  /**
   * Handles bulk delete operations
   * @param formData - Form data containing delete parameters
   * @returns Promise resolving to action result
   */
  static async handleBulkDelete(formData: FormData): Promise<ActionResult> {
    try {
      // 1. Get authenticated context
      const context = await AuthenticationService.getAuthenticatedContext();

      // 2. Extract and validate form data
      const extractionResult = FormDataExtractionService.extractBulkDelete(formData, {
        userId: context.user.id,
        organizationId: context.organizationId
      });

      if (!extractionResult.isValid) {
        return { 
          success: false, 
          error: extractionResult.errors.join(', ') 
        };
      }

      const request = extractionResult.data!;

      // 3. Create use case and execute
      const supabase = AuthenticationService.createSupabaseClient();
      const factory = new RepositoryFactoryService(supabase);
      const useCase = factory.createBulkDeleteUseCase();

      const result = await useCase.execute({
        assetIds: request.assetIds,
        folderIds: request.folderIds,
        organizationId: request.organizationId,
        userId: request.userId,
        confirmationRequired: request.confirmationRequired
      });

      // 4. Check if any items were successfully deleted
      const totalDeleted = result.deletedAssetIds.length + result.deletedFolderIds.length;
      const totalFailed = result.failedAssetIds.length + result.failedFolderIds.length;

      if (totalDeleted === 0 && totalFailed > 0) {
        return { 
          success: false, 
          error: `Failed to delete items: ${result.errors.join(', ')}` 
        };
      }

      // 5. Revalidate DAM pages - removed for client-side fetching  
      // revalidatePath('/dam'); // REMOVED - causes unnecessary POST /dam calls
      // revalidatePath('/dam/[...path]', 'page'); // REMOVED - causes unnecessary POST /dam calls

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bulk delete failed'
      };
    }
  }

  /**
   * Handles bulk tag operations
   * @param formData - Form data containing tag parameters
   * @returns Promise resolving to action result
   */
  static async handleBulkTag(formData: FormData): Promise<ActionResult> {
    try {
      // 1. Get authenticated context
      const context = await AuthenticationService.getAuthenticatedContext();

      // 2. Extract and validate form data
      const extractionResult = FormDataExtractionService.extractBulkTag(formData, {
        userId: context.user.id,
        organizationId: context.organizationId
      });

      if (!extractionResult.isValid) {
        return { 
          success: false, 
          error: extractionResult.errors.join(', ') 
        };
      }

      // TODO: Implement bulk tag use case when available
      
      // 3. Revalidate DAM pages - removed for client-side fetching
      // revalidatePath('/dam'); // REMOVED - causes unnecessary POST /dam calls
      // revalidatePath('/dam/[...path]', 'page'); // REMOVED - causes unnecessary POST /dam calls

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bulk tag operation failed'
      };
    }
  }

  /**
   * Handles bulk download operations
   * @param formData - Form data containing download parameters
   * @returns Promise resolving to download action result
   */
  static async handleBulkDownload(formData: FormData): Promise<DownloadActionResult> {
    try {
      // 1. Get authenticated context
      const context = await AuthenticationService.getAuthenticatedContext();

      // 2. Extract and validate form data
      const extractionResult = FormDataExtractionService.extractBulkDownload(formData, {
        userId: context.user.id,
        organizationId: context.organizationId
      });

      if (!extractionResult.isValid) {
        return { 
          success: false, 
          error: extractionResult.errors.join(', ') 
        };
      }

      const request = extractionResult.data!;

      // 3. Create use case and execute
      const supabase = AuthenticationService.createSupabaseClient();
      const factory = new RepositoryFactoryService(supabase);
      const useCase = factory.createBulkDownloadUseCase();

      const result = await useCase.execute({
        assetIds: request.assetIds,
        folderIds: request.folderIds,
        organizationId: request.organizationId,
        userId: request.userId,
        format: request.format
      });

      // 4. Convert blob to base64 if present
      let zipBase64: string | undefined;
      if (result.zipBlob) {
        const arrayBuffer = await result.zipBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        zipBase64 = Buffer.from(uint8Array).toString('base64');
      }

      return {
        success: true,
        downloadUrls: result.downloadUrls,
        zipBase64,
        zipFileName: result.zipFileName
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bulk download failed'
      };
    }
  }
} 