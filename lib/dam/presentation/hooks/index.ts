// DAM Presentation Layer Hooks
// Domain-driven hooks for state management and data fetching

// ✅ Completed migrations
// TODO: Fix TypeScript resolution issue
// export { useDamGalleryData } from './useDamGalleryData';
// export type { DomainGalleryState } from './useDamGalleryData';

export { useDamDragAndDrop } from './useDamDragAndDrop';

// ✅ Other working hooks
export { useSavedSearches } from './useSavedSearches';
export { useAssetUpload } from './useAssetUpload';
export { useFolderNavigation } from './useFolderNavigation';

// ✅ Migrated hooks from Phase 4, 5B & 5C
export { useDamSearchInput } from './useDamSearchInput';
export { useDamSearchDropdown } from './useDamSearchDropdown';
export { useDamUrlManager } from './useDamUrlManager';
export { useDamTagFilterHandler } from './useDamTagFilterHandler';
export { useDamFilters, type SortByValue, type SortOrderValue, type DamFilterState, type UseDamFiltersReturn } from './useDamFilters';
export { useAssetItemActions, type UseAssetItemActionsProps, type UseAssetItemActionsReturn } from './useAssetItemActions';
export { useAssetItemDialogs, type UseAssetItemDialogsReturn } from './useAssetItemDialogs';

// TODO: Migrate remaining hooks from components/dam/hooks/
// ✅ useAssetItemDialogs (completed in Phase 5A)

// Placeholder to avoid linter errors
export {}; 