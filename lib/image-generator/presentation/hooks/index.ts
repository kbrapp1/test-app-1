// Shared types and utilities
export * from './shared/types';
export { IMAGE_GENERATION_QUERY_KEYS } from './shared/queryKeys';

// Mutation hooks (write operations)
export { useGenerateImage } from './mutations/useGenerateImage';
export { useCancelGeneration } from './mutations/useCancelGeneration';
export { useSaveGenerationToDAM } from './mutations/useSaveGenerationToDAM';

// Query hooks (read operations)  
export { useGenerations } from './queries/useGenerations';
export { useGeneration } from './queries/useGeneration';
export { useGenerationStats } from './queries/useGenerationStats';

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

// DDD-compliant extracted hooks
export { useImageGeneratorState } from './useImageGeneratorState';
export { usePromptEnhancement } from './usePromptEnhancement';
export { useActionHandlers } from './useActionHandlers';
export { useGenerationOrchestration } from './useGenerationOrchestration';
export { useProviderSelection } from './useProviderSelection'; 