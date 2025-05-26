// Gallery Components - DAM Presentation Layer
// Active production components

// ✅ PRODUCTION COMPONENTS:

// ✅ AssetGalleryClient.tsx - Main client component with domain hooks
// - Uses useDamGalleryData hook with GalleryItemDto
// - Domain-driven state management
// - Supports grid/list view modes with drag & drop

// ✅ AssetGalleryRenderer.tsx - Rendering logic component
// - Handles view mode switching and item rendering
// - Clean separation of concerns

// ✅ Individual Item Components:
// - EnhancedAssetGridItem.tsx - Grid view asset rendering with click vs drag
// - AssetListItem.tsx - List view asset rendering  
// - FolderItem.tsx - Folder rendering for both views

// ✅ Layout Components:
// - GalleryLayout.tsx - Main layout wrapper
// - GalleryDialogs.tsx - Dialog management

// Export main components
export { AssetGalleryClient } from './AssetGalleryClient';
export { AssetGalleryRenderer } from './AssetGalleryRenderer';
export { GalleryLayout } from './GalleryLayout';
export { GalleryDialogs } from './GalleryDialogs';

// Export item components
export { EnhancedAssetGridItem } from './enhanced/EnhancedAssetGridItem';
export { AssetListItem } from './AssetListItem';
export { FolderItem } from './folder-item'; 
