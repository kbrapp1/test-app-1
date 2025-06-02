import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';
import { CostEstimationService, ProviderComparison } from '../../../application/services/CostEstimationService';
import { ProviderService } from '../../../application/services/ProviderService';
import { ProviderFactory } from '../../../infrastructure/providers/ProviderFactory';

export interface UseProviderComparisonParams {
  prompt: string;
  aspectRatio?: string;
  hasBaseImage?: boolean;
  outputFormat?: string;
  safetyTolerance?: number;
  enabled?: boolean;
}

export interface UseProviderComparisonReturn {
  comparisons: ProviderComparison[];
  cheapestOption: ProviderComparison | undefined;
  fastestOption: ProviderComparison | undefined;
  recommendedOptions: ProviderComparison[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook for comparing costs and capabilities across all available providers
 * Single Responsibility: Provide comprehensive provider comparison data
 */
export function useProviderComparison(params: UseProviderComparisonParams): UseProviderComparisonReturn {
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

  // Create cache key for the comparison request
  const cacheKey = useMemo(() => [
    'provider-comparison',
    params.aspectRatio || '1:1',
    params.hasBaseImage ? 'edit' : 'generate',
    params.outputFormat || 'default',
    params.safetyTolerance || 2,
  ], [
    params.aspectRatio,
    params.hasBaseImage,
    params.outputFormat,
    params.safetyTolerance,
  ]);

  // React Query for provider comparison
  const {
    data: comparisons = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: cacheKey,
    queryFn: () => {
      const costService = getCostService();
      return costService.compareProviderCosts({
        prompt: params.prompt,
        aspectRatio: params.aspectRatio,
        hasBaseImage: params.hasBaseImage,
        outputFormat: params.outputFormat,
        safetyTolerance: params.safetyTolerance,
      });
    },
    enabled: params.enabled !== false && !!params.prompt.trim(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Derived data from comparisons
  const derivedData = useMemo(() => {
    const cheapestOption = comparisons.length > 0 
      ? comparisons.reduce((cheapest, current) => 
          current.estimatedCents < cheapest.estimatedCents ? current : cheapest
        )
      : undefined;

    const fastestOption = comparisons.length > 0
      ? comparisons.reduce((fastest, current) => 
          current.estimatedTimeSeconds < fastest.estimatedTimeSeconds ? current : fastest
        )
      : undefined;

    const recommendedOptions = comparisons.filter(option => option.isRecommended);

    return {
      cheapestOption,
      fastestOption,
      recommendedOptions,
    };
  }, [comparisons]);

  return {
    comparisons,
    cheapestOption: derivedData.cheapestOption,
    fastestOption: derivedData.fastestOption,
    recommendedOptions: derivedData.recommendedOptions,
    isLoading,
    error: error as Error | null,
    refetch,
  };
} 