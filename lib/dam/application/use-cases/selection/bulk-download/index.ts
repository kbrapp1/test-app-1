/**
 * Bulk Download Module Exports
 * 
 * Re-exports for the refactored bulk download functionality
 * Maintains backward compatibility while providing access to modular components
 */

// Main use case export
export { BulkDownloadAssetsUseCase } from './BulkDownloadAssetsUseCase';

// Types
export type {
  AssetInfo,
  DownloadRequest,
  DownloadResult,
  ZipOptions,
  ZipCreationResult,
  BulkDownloadAssetsUseCaseRequest,
  BulkDownloadAssetsUseCaseResponse
} from './types';

// Services (for advanced usage)
export { DownloadValidationService } from './services/DownloadValidationService';
export { AssetCollectionService } from './services/AssetCollectionService';
export { FolderCollectionService } from './services/FolderCollectionService';

// Strategies (for advanced usage)
export { IndividualDownloadStrategy } from './strategies/IndividualDownloadStrategy';
export { ZipDownloadStrategy } from './strategies/ZipDownloadStrategy'; 