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
  return await SelectionUpdateHandler.handle(formData);
}

/**
 * Server action for bulk move operations
 * @param formData - Form data containing move parameters
 * @returns Promise resolving to action result
 */
export async function bulkMoveItems(formData: FormData): Promise<ActionResult> {
  return await BulkOperationHandler.handleBulkMove(formData);
}

/**
 * Server action for bulk delete operations
 * @param formData - Form data containing delete parameters
 * @returns Promise resolving to action result
 */
export async function bulkDeleteItems(formData: FormData): Promise<ActionResult> {
  return await BulkOperationHandler.handleBulkDelete(formData);
}

/**
 * Server action for bulk tag operations
 * @param formData - Form data containing tag parameters
 * @returns Promise resolving to action result
 */
export async function bulkTagItems(formData: FormData): Promise<ActionResult> {
  return await BulkOperationHandler.handleBulkTag(formData);
}

/**
 * Server action for bulk download operations
 * @param formData - Form data containing download parameters
 * @returns Promise resolving to download action result
 */
export async function bulkDownloadItems(formData: FormData): Promise<DownloadActionResult> {
  return await BulkOperationHandler.handleBulkDownload(formData);
} 