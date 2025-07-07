import { ProviderService } from './ProviderService';
import { ProviderId, ModelId } from '../../domain/value-objects/Provider';

export interface CostEstimate {
  estimatedCents: number;
  currency: string;
  confidence: 'low' | 'medium' | 'high';
  breakdown?: {
    baseCost: number;
    qualityMultiplier?: number;
    dimensionMultiplier?: number;
    editingMultiplier?: number;
  };
}

export interface ProviderComparison {
  providerId: ProviderId;
  modelId: ModelId;
  name: string;
  estimatedCents: number;
  estimatedTimeSeconds: number;
  reasoning: string;
  isRecommended: boolean;
}

export interface GenerationRequest {
  prompt: string;
  providerId: ProviderId;
  modelId: ModelId;
  aspectRatio?: string;
  hasBaseImage?: boolean;
  outputFormat?: string;
  safetyTolerance?: number;
}

export interface SpendingReport {
  currentMonthCents: number;
  previousMonthCents: number;
  totalGenerations: number;
  averageCostPerGeneration: number;
  projectedMonthlySpend: number;
}

export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Cost Estimation Service
 * Single Responsibility: Coordinate cost estimation across providers and provide cost insights
 */
export class CostEstimationService {
  private cache = new Map<string, { estimate: CostEstimate; timestamp: number }>();
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly providerService: ProviderService) {}

  /**
   * Estimate cost for a specific generation request
   */
  async estimateGenerationCost(request: GenerationRequest): Promise<CostEstimate> {
    const cacheKey = this.getCacheKey(request);
    const cached = this.cache.get(cacheKey);
    
    // Return cached estimate if still valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION_MS) {
      return cached.estimate;
    }

    const providers = this.providerService.getAvailableProviders();
    const provider = providers.find(p => p.providerId === request.providerId);
    
    if (!provider) {
      return {
        estimatedCents: 0,
        currency: 'USD',
        confidence: 'low'
      };
    }

    const model = await provider.getModel(request.modelId);
    if (!model) {
      return {
        estimatedCents: 0,
        currency: 'USD',
        confidence: 'low'
      };
    }

    const baseCost = model.capabilities.costPerGeneration;
    let qualityMultiplier = 1;
    let dimensionMultiplier = 1;
    let editingMultiplier = 1;

    // Apply multipliers based on request parameters
    if (request.hasBaseImage && model.capabilities.supportsImageEditing) {
      editingMultiplier = 1.2; // 20% premium for image editing
    }

    // Higher resolution costs more for some providers
    if (request.aspectRatio && this.isHighResolution(request.aspectRatio)) {
      dimensionMultiplier = 1.1; // 10% premium for high resolution
    }

    // Premium output formats
    if (request.outputFormat === 'png') {
      qualityMultiplier = 1.05; // 5% premium for PNG
    }

    const totalCost = Math.round(baseCost * qualityMultiplier * dimensionMultiplier * editingMultiplier);

    const estimate: CostEstimate = {
      estimatedCents: totalCost,
      currency: 'USD',
      confidence: 'high',
      breakdown: {
        baseCost,
        qualityMultiplier: qualityMultiplier !== 1 ? qualityMultiplier : undefined,
        dimensionMultiplier: dimensionMultiplier !== 1 ? dimensionMultiplier : undefined,
        editingMultiplier: editingMultiplier !== 1 ? editingMultiplier : undefined,
      }
    };

    // Cache the estimate
    this.cache.set(cacheKey, { estimate, timestamp: Date.now() });

    return estimate;
  }

  /**
   * Compare costs across all available providers for a given request
   */
  async compareProviderCosts(baseRequest: Omit<GenerationRequest, 'providerId' | 'modelId'>): Promise<ProviderComparison[]> {
    const providers = this.providerService.getAvailableProviders();
    const comparisons: ProviderComparison[] = [];

    for (const provider of providers) {
      const models = await provider.getSupportedModels();
      for (const model of models) {
        // Skip if provider doesn't support the requested features
        if (baseRequest.hasBaseImage && !model.capabilities.supportsImageEditing) {
          continue;
        }

        const request: GenerationRequest = {
          ...baseRequest,
          providerId: provider.providerId,
          modelId: model.id,
        };

        const estimate = await this.estimateGenerationCost(request);
        
                 comparisons.push({
           providerId: provider.providerId,
           modelId: model.id,
           name: `${provider.providerId} - ${model.name}`,
           estimatedCents: estimate.estimatedCents,
           estimatedTimeSeconds: model.capabilities.estimatedTimeSeconds,
           reasoning: this.getReasoningText(model, baseRequest),
           isRecommended: false, // Will be set by recommendation logic
         });
      }
    }

    // Sort by cost and mark recommended options
    comparisons.sort((a, b) => a.estimatedCents - b.estimatedCents);
    
    if (comparisons.length > 0) {
      // Mark the cheapest option as recommended for budget-conscious users
      comparisons[0].isRecommended = true;
      
      // Also mark a "best value" option (balance of cost, speed, and quality)
      const bestValue = this.findBestValueOption(comparisons);
      if (bestValue && bestValue !== comparisons[0]) {
        bestValue.isRecommended = true;
      }
    }

    return comparisons;
  }

  /**
   * Calculate user spending for a given timeframe
   * Note: This would integrate with the generation repository in production
   */
  async calculateUserSpending(userId: string, timeframe: TimeRange): Promise<SpendingReport> {
    // Placeholder implementation - would query actual generation data
    return {
      currentMonthCents: 0,
      previousMonthCents: 0,
      totalGenerations: 0,
      averageCostPerGeneration: 0,
      projectedMonthlySpend: 0,
    };
  }

  private getCacheKey(request: GenerationRequest): string {
    return `${request.providerId}:${request.modelId}:${request.aspectRatio || '1:1'}:${request.hasBaseImage ? 'edit' : 'generate'}:${request.outputFormat || 'default'}`;
  }

  private isHighResolution(aspectRatio: string): boolean {
    const highResRatios = ['21:9', '9:21', '3:7', '7:3'];
    return highResRatios.includes(aspectRatio);
  }

  private getReasoningText(model: any, request: Omit<GenerationRequest, 'providerId' | 'modelId'>): string {
    const reasons: string[] = [];

    if (model.capabilities.costPerGeneration <= 2) {
      reasons.push('Most cost-effective');
    } else if (model.capabilities.costPerGeneration >= 8) {
      reasons.push('Premium quality');
    }

    if (model.capabilities.estimatedTimeSeconds <= 15) {
      reasons.push('Fast generation');
    }

    if (request.hasBaseImage && model.capabilities.supportsImageEditing) {
      reasons.push('Supports image editing');
    }

    if (model.capabilities.supportsStyleControls) {
      reasons.push('Advanced style controls');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'Standard option';
  }

  private findBestValueOption(comparisons: ProviderComparison[]): ProviderComparison | undefined {
    // Score based on cost efficiency and speed
    let bestScore = -1;
    let bestOption: ProviderComparison | undefined;

    for (const option of comparisons) {
      // Normalize cost (lower is better) and time (lower is better)
      const costScore = 100 / Math.max(option.estimatedCents, 1);
      const speedScore = 100 / Math.max(option.estimatedTimeSeconds, 1);
      const totalScore = costScore + speedScore;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestOption = option;
      }
    }

    return bestOption;
  }
} 