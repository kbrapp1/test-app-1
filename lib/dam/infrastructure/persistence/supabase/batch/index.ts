// Re-exports for backward compatibility and clean API surface
export { SupabaseBatchRepository } from './SupabaseBatchRepository';
export { BatchMoveOperation } from './operations/BatchMoveOperation';
export { BatchDeleteOperation } from './operations/BatchDeleteOperation';
export { BatchValidationService } from './services/BatchValidationService';
export type { BatchOperationResult, ValidationResult, AssetEntity, FolderEntity } from './types'; 