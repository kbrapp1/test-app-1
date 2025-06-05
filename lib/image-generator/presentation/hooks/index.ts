// Shared types and utilities
export * from './shared/types';
export { IMAGE_GENERATION_QUERY_KEYS } from './shared/queryKeys';

// Shared data hooks
export { useSharedGenerations } from './shared/useSharedGenerations';

// Mutation hooks (write operations)
export { useGenerateImage } from './mutations/useGenerateImage';
export { useCancelGeneration } from './mutations/useCancelGeneration';
export { useSaveGenerationToDAM } from './mutations/useSaveGenerationToDAM';
export { useDeleteGeneration } from './mutations/useDeleteGeneration';

// Query hooks (read operations)  
export { useGenerations } from './queries/useGenerations';
export { useInfiniteGenerations } from './queries/useInfiniteGenerations';
export { useGeneration } from './queries/useGeneration';
export { useGenerationStats } from './queries/useGenerationStats';
export { useGenerationSearch as useServerGenerationSearch } from './queries/useGenerationSearch';

// Specialized hooks
export { useGenerationPolling } from './specialized/useGenerationPolling';

// Backward compatibility - re-export the optimized hook if needed
export { useImageGenerationOptimized } from './useImageGenerationOptimized';

// Component state hooks
export { useFileUpload } from './useFileUpload';
export { useHistoryPanel } from './useHistoryPanel';
export { useGenerationSearch } from './useGenerationSearch';
export { useGenerationActions } from './useGenerationActions';
export { useLatestGeneration } from './useLatestGeneration';

// Main coordinator hook (with bug fix)
export { useImageGeneratorCoordinator } from './useImageGeneratorCoordinator';

// DDD-compliant extracted hooks
export { useImageGeneratorState } from './useImageGeneratorState';
export { usePromptEnhancement } from './usePromptEnhancement';
export { useProviderSelection } from './useProviderSelection'; 