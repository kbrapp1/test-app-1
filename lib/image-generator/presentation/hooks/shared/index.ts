// Specialized hooks for image generation optimization
// Following DDD principles and Single Responsibility Principle

export { useGenerationCacheManager } from './useGenerationCacheManager';
export { useOptimizedStatusCheck } from './useOptimizedStatusCheck';
export { useGenerationListRefresh } from './useGenerationListRefresh';
export { useGenerationStateComputed } from './useGenerationStateComputed';
export { useOptimizedGenerate } from './useOptimizedGenerate';

// Re-export shared types
export type { GetGenerationsFilters } from './types'; 