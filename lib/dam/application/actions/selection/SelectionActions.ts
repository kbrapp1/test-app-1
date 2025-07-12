/**
 * Main Selection Actions - Application Layer
 * 
 * Single Responsibility: Coordinates selection action handlers
 * Provides clean server action interface following DDD principles
 * Maintains original API for backward compatibility
 */

'use server';

import { SelectionUpdateHandler } from './handlers/SelectionUpdateHandler';
import { BulkOperationHandler } from './handlers/BulkOperationHandler';
import { apiDeduplicationService } from '@/lib/shared/infrastructure/ApiDeduplicationService';
import type { 
  SelectionActionResult,
  ActionResult,
  DownloadActionResult
} from './types';

/**
 * Server action for updating selection state
 * @param formData - Form data containing selection update parameters
 * @returns Promise resolving to selection action result
 */
export async function updateSelection(formData: FormData): Promise<SelectionActionResult> {
  // 🔄 Apply deduplication to prevent rapid selection updates
  return await apiDeduplicationService.deduplicateServerAction(
    'updateSelection',
    [Array.from(formData.entries())],
    () => SelectionUpdateHandler.handle(formData),
    'dam-operations' // Use DAM operations domain timeout
  );
}

/**
 * Server action for bulk move operations
 * @param formData - Form data containing move parameters
 * @returns Promise resolving to action result
 */
export async function bulkMoveItems(formData: FormData): Promise<ActionResult> {
  // 🔄 Apply deduplication to prevent accidental bulk operations
  return await apiDeduplicationService.deduplicateServerAction(
    'bulkMoveItems',
    [Array.from(formData.entries())],
    () => BulkOperationHandler.handleBulkMove(formData),
    'dam-operations' // Use DAM operations domain timeout
  );
}

/**
 * Server action for bulk delete operations
 * @param formData - Form data containing delete parameters
 * @returns Promise resolving to action result
 */
export async function bulkDeleteItems(formData: FormData): Promise<ActionResult> {
  // 🔄 Apply deduplication to prevent accidental bulk deletions
  return await apiDeduplicationService.deduplicateServerAction(
    'bulkDeleteItems',
    [Array.from(formData.entries())],
    () => BulkOperationHandler.handleBulkDelete(formData),
    'dam-operations' // Use DAM operations domain timeout
  );
}

/**
 * Server action for bulk tag operations
 * @param formData - Form data containing tag parameters
 * @returns Promise resolving to action result
 */
export async function bulkTagItems(formData: FormData): Promise<ActionResult> {
  // 🔄 Apply deduplication to prevent rapid tag operations
  return await apiDeduplicationService.deduplicateServerAction(
    'bulkTagItems',
    [Array.from(formData.entries())],
    () => BulkOperationHandler.handleBulkTag(formData),
    'dam-operations' // Use DAM operations domain timeout
  );
}

/**
 * Server action for bulk download operations
 * @param formData - Form data containing download parameters
 * @returns Promise resolving to download action result
 */
export async function bulkDownloadItems(formData: FormData): Promise<DownloadActionResult> {
  // 🔄 Apply deduplication to prevent rapid download requests
  return await apiDeduplicationService.deduplicateServerAction(
    'bulkDownloadItems',
    [Array.from(formData.entries())],
    () => BulkOperationHandler.handleBulkDownload(formData),
    'dam-operations' // Use DAM operations domain timeout
  );
} 