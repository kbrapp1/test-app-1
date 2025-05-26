// Re-export main hook for backward compatibility
export { useAssetGalleryState } from './useAssetGalleryState';

// Export specialized hooks for advanced usage
export { useGalleryData } from './state/useGalleryData';
export { useGallerySelection } from './state/useGallerySelection';
export { useGalleryBulkOperations } from './state/useGalleryBulkOperations';
export { useGalleryEventHandlers } from './handlers/useGalleryEventHandlers';
export { useGalleryStateManager } from './services/GalleryStateManager'; 