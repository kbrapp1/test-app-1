// Gallery Components - DAM Presentation Layer
// These exports track the migration progress from components/dam/

// ✅ COMPLETED MIGRATIONS:

// ✅ AssetGallery.tsx - Server component with domain use cases
// - Location: lib/dam/presentation/components/gallery/AssetGallery.tsx
// - Uses ListFolderContentsUseCase instead of server actions
// - Clean DDD architecture with proper dependency direction
// - Ready for use in DAM pages

// ✅ AssetGalleryClient.tsx - Client component with domain hooks
// - Location: lib/dam/presentation/components/gallery/AssetGalleryClient.tsx
// - Uses useDamGalleryData hook with GalleryItemDto
// - Domain-driven state management
// - Supports grid/list view modes

// ✅ DomainGallery.tsx - Combined demonstration component
// - Location: lib/dam/presentation/components/gallery/DomainGallery.tsx
// - Shows server vs client rendering approaches
// - Educational component for DDD architecture comparison
// - Supports multiple rendering modes

// TODO: Enable these exports after resolving module paths
// export { AssetGallery } from './AssetGallery';
// export { AssetGalleryClient } from './AssetGalleryClient';
// export { DomainGallery } from './DomainGallery';

// TODO: Migrate remaining components
// export { default as AssetGalleryClientWrapper } from './AssetGalleryClientWrapper';
// export { default as AssetGrid } from './AssetGrid';

// Types
// export type { AssetGalleryProps, AssetGridProps } from '../types/interfaces';

// Progress: 3/5 core gallery components migrated ✅

// Placeholder for now
export {}; 