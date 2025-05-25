// Navigation Components - DAM Presentation Layer
// Domain navigation components following DDD patterns

// ✅ Migrated navigation components
export { DamBreadcrumbs } from './DamBreadcrumbs';
export type { DamBreadcrumbsProps, BreadcrumbItemData } from './DamBreadcrumbs';

export { FolderSidebar } from './FolderSidebar';
export type { FolderSidebarProps } from './FolderSidebar';

export { FolderNavigationItem } from './FolderNavigationItem';
export type { FolderNavigationItemProps } from './FolderNavigationItem';

// Extracted navigation components (following DDD Single Responsibility Principle)
export * from './components';
export * from './hooks';
export * from './services';

// Progress: All core navigation components migrated ✅ 
