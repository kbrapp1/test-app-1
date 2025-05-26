/**
 * Drag and Drop Module Exports
 * 
 * Re-exports for the refactored drag and drop functionality
 * Maintains backward compatibility while providing access to modular components
 */

// Main hook export
export { useDamDragAndDrop } from './useDamDragAndDrop';

// Types
export type {
  DragOperation,
  DragValidationResult,
  BulkMoveSelection,
  DragEndResult,
  UseDamDragAndDropProps,
  DragEndParams
} from './types';

// Services (for advanced usage)
export { DragOperationFactory } from './services/DragOperationFactory';
export { DragValidationService } from './services/DragValidationService';
export { AuthContextService } from './services/AuthContextService';
export { SelectionStateService } from './services/SelectionStateService';

// Operations (for advanced usage)
export { MoveOperationsService } from './operations/MoveOperationsService';
export { BulkMoveOperationsService } from './operations/BulkMoveOperationsService';

// Hooks (for advanced usage)
export { useDragEndHandler } from './useDragEndHandler'; 