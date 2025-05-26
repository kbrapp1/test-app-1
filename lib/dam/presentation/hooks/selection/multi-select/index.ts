// Re-exports for clean API surface and backward compatibility
export { useMultiSelect } from './useMultiSelect';
export { useMultiSelectState } from './state/useMultiSelectState';
export { useMultiSelectOperations } from './operations/useMultiSelectOperations';
export { useMultiSelectValidation } from './validation/useMultiSelectValidation';
export { useMultiSelectEventHandlers } from './handlers/useMultiSelectEventHandlers';
export type { 
  UseMultiSelectOptions, 
  UseMultiSelectReturn, 
  SelectionMode, 
  ItemType, 
  MultiSelectState 
} from './types'; 