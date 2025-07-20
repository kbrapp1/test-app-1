// Value Objects - Domain Layer
export * from './SearchCriteria';
export * from './BulkOperation';
export * from './TagColor';
export * from './GalleryItem';
export * from './DamDataResult';

// Domain Services
export { TagColorService } from '../services/TagColorService';

// Bulk Operation Value Objects
export type {
  BulkOperationType,
  BaseBulkOperation,
  BulkMoveOperation,
  BulkDeleteOperation,
  BulkTagOperation,
  BulkDownloadOperation,
  BulkCopyOperation,
  BulkOperation
} from './BulkOperation';

export { BulkOperationFactory } from './BulkOperationFactory';
export { BulkOperationValidation } from './BulkOperationValidation'; 