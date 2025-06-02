import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';
import { CostEstimationService, CostEstimate, GenerationRequest as CostRequest } from '../../../application/services/CostEstimationService';
import { ProviderService } from '../../../application/services/ProviderService';
import { ProviderFactory } from '../../../infrastructure/providers/ProviderFactory';
import { ProviderId, ModelId } from '../../../domain/value-objects/Provider';

export interface UseCostEstimationParams {
  prompt: string;
  providerId: ProviderId;
  modelId: ModelId;
  aspectRatio?: string;
  hasBaseImage?: boolean;
  outputFormat?: string;
  safetyTolerance?: number;
  enabled?: boolean;
}

export interface UseCostEstimationReturn {
  estimate: CostEstimate | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook for real-time cost estimation with debouncing and caching
 * Single Responsibility: Provide cost estimates for generation requests
 */
export function useCostEstimation(params: UseCostEstimationParams): UseCostEstimationReturn {
  const costServiceRef = useRef<CostEstimationService | null>(null);

  // Initialize cost service (lazy)
  const getCostService = () => {
    if (!costServiceRef.current) {
      const registry = ProviderFactory.createProviderRegistry();
      const providerService = new ProviderService(registry);
      costServiceRef.current = new CostEstimationService(providerService);
    }
    return costServiceRef.current;
  };

  // Create cache key for the request
  const cacheKey = useMemo(() => [
    'cost-estimation',
    params.providerId,
    params.modelId,
    params.aspectRatio || '1:1',
    params.hasBaseImage ? 'edit' : 'generate',
    params.outputFormat || 'default',
    params.safetyTolerance || 2,
    // Don't include prompt in cache key to avoid excessive cache entries
    // Cost estimation is typically independent of prompt content
  ], [
    params.providerId,
    params.modelId,
    params.aspectRatio,
    params.hasBaseImage,
    params.outputFormat,
    params.safetyTolerance,
  ]);

  // Prepare cost request
  const costRequest: CostRequest = useMemo(() => ({
    prompt: params.prompt,
    providerId: params.providerId,
    modelId: params.modelId,
    aspectRatio: params.aspectRatio,
    hasBaseImage: params.hasBaseImage,
    outputFormat: params.outputFormat,
    safetyTolerance: params.safetyTolerance,
  }), [
    params.prompt,
    params.providerId,
    params.modelId,
    params.aspectRatio,
    params.hasBaseImage,
    params.outputFormat,
    params.safetyTolerance,
  ]);

  // React Query for cost estimation
  const {
    data: estimate,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: cacheKey,
    queryFn: () => {
      const costService = getCostService();
      return costService.estimateGenerationCost(costRequest);
    },
    enabled: params.enabled !== false && !!params.prompt.trim(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, error) => {
      // Don't retry for invalid provider/model combinations
      if (error instanceof Error && error.message.includes('not found')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  return {
    estimate,
    isLoading,
    error: error as Error | null,
    refetch,
  };
} 