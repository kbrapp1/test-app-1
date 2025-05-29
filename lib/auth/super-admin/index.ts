/**
 * Super Admin Module
 * 
 * Centralized exports for super admin functionality
 * Following DDD module organization principles
 * 
 * NOTE: This file only exports client-safe functionality.
 * For server-only caching functions, import directly from './caching'
 */

// Types (client-safe)
export type {
  Profile,
  SuperAdminAuditEntry,
  SuperAdminAction,
  SuperAdminContext,
  AuthContextType,
} from './types';

// Services (client-safe)
export {
  SuperAdminPermissionService,
  isSuperAdmin,
  canAccessAllOrganizations,
  canManageOrganization,
  getAccessibleOrganizations,
} from './permissions';

// Hooks (client-safe)
export {
  useAuthWithSuperAdmin,
  useSuperAdminContext,
} from './hooks';

// Query Services (client-safe)
export {
  SuperAdminQueryService,
  queryDataWithSuperAdmin,
  createSuperAdminQueryOptions,
} from './queries';
export type {
  QueryOptions,
  SuperAdminQueryOptions,
} from './queries';

// Mutation Services (can be used in server actions)
export {
  SuperAdminMutationService,
  insertDataWithSuperAdmin,
  updateDataWithSuperAdmin,
  deleteDataWithSuperAdmin,
} from './mutations';
export type {
  MutationOptions,
} from './mutations';

// Server Actions (client-safe wrappers for caching)
export {
  invalidateDamCacheAction,
  invalidateTeamCacheAction,
  invalidateOrganizationCacheAction,
  invalidateAllOrganizationsCacheAction,
} from './server-actions';

// Server-only caching functions are NOT exported here
// Import directly from './caching' in server components/actions only 