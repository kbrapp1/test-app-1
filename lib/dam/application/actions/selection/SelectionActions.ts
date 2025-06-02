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
import { apiDeduplicationService } from '../../services/ApiDeduplicationService';
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
    500 // 500ms window for selection updates
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
    2000 // 2 second window for bulk operations
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
    3000 // 3 second window for delete operations (safety)
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
    1000 // 1 second window for tag operations
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
    2000 // 2 second window for download operations
  );
} 