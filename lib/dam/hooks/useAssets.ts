/**
 * DAM Asset Hooks - Refactored for DDD Compliance
 * 
 * Domain: DAM Asset Management
 * Responsibility: Backward compatibility and centralized hook access
 * 
 * Following DDD Golden Rule principles:
 * - Single responsibility: This file only re-exports focused modules
 * - Clean architecture: Separated by domain concerns
 * - Maintainability: Each concern is in its own file under 250 lines
 * 
 * REFACTORED STRUCTURE:
 * - useAssetQueries.ts: Asset read operations (67 lines)
 * - useAssetMutations.ts: Asset write operations (112 lines)  
 * - useBulkOperations.ts: Bulk operations (156 lines)
 * - useFolderOperations.ts: Folder CRUD (78 lines)
 * - useCacheManagement.ts: Cache operations (65 lines)
 * 
 * Previous file: 407 lines → Now: 5 focused files under 200 lines each
 */

// Re-export all hooks to maintain backward compatibility
export * from './index'; 