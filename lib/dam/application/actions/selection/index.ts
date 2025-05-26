/**
 * Selection Actions Module Exports
 * 
 * Re-exports for the refactored selection actions functionality
 * Maintains backward compatibility while providing access to modular components
 */

// Main actions export
export {
  updateSelection,
  bulkMoveItems,
  bulkDeleteItems,
  bulkTagItems,
  bulkDownloadItems
} from './SelectionActions';

// Types
export type {
  ActionResult,
  SelectionActionResult,
  DownloadActionResult,
  SelectionUpdateRequest,
  BulkOperationRequest,
  BulkMoveRequest,
  BulkDeleteRequest,
  BulkTagRequest,
  BulkDownloadRequest,
  AuthenticatedContext,
  ExtractedFormData
} from './types';

// Note: Services and handlers are not exported as they contain server-only code
// They are used internally by the main SelectionActions.ts
// Only types and main actions are safe for client-side imports 