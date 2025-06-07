// Shared types and utilities
export * from './shared/types';
export { IMAGE_GENERATION_QUERY_KEYS } from './shared/queryKeys';

// Shared data hooks
// useSharedGenerations removed - replaced with useInfiniteGenerations

// Mutation hooks (write operations)
export { useGenerateImage } from './mutations/useGenerateImage';
export { useCancelGeneration } from './mutations/useCancelGeneration';
export { useSaveGenerationToDAM } from './mutations/useSaveGenerationToDAM';
export { useDeleteGeneration } from './mutations/useDeleteGeneration';

// Query hooks (read operations)  
export { useInfiniteGenerations } from './queries/useInfiniteGenerations';
export { useGeneration } from './queries/useGeneration';
export { useGenerationStats } from './queries/useGenerationStats';
export { useGenerationSearch as useServerGenerationSearch } from './queries/useGenerationSearch';

// Specialized hooks
// useGenerationPolling removed - file doesn't exist

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