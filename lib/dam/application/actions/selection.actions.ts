/**
 * Selection Actions - Backward Compatibility Layer
 * 
 * Re-exports refactored selection actions to maintain API compatibility
 * Original 344-line file refactored into modular DDD structure
 */

// Re-export all selection actions from the refactored module
export {
  updateSelection,
  bulkMoveItems,
  bulkDeleteItems,
  bulkTagItems,
  bulkDownloadItems
} from './selection'; 