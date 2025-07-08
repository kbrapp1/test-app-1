/**
 * Message Cost Calculation Service
 * 
 * Domain Service: Pure business logic for calculating message costs
 * Single Responsibility: Cost calculations with no external dependencies
 * Following DDD domain layer patterns (~150 lines)
 */

export interface ModelPricing {
  promptTokenRate: number;  // Rate per 1K tokens
  completionTokenRate: number;  // Rate per 1K tokens
  currency: 'USD';
}

export interface CostBreakdown {
  promptTokensCents: number;    // Precise decimal cents (e.g., 0.0822)
  completionTokensCents: number; // Precise decimal cents (e.g., 0.033)
  totalCents: number;           // Precise total (e.g., 0.1152)
  displayCents: number;         // Rounded for display (e.g., 0.12)
  modelRate?: number;
}

export class MessageCostCalculationService {
  private static readonly MODEL_PRICING: Record<string, ModelPricing> = {
    'gpt-4o-mini': {
      promptTokenRate: 0.00015,     // $0.15 per 1K tokens
      completionTokenRate: 0.0006,  // $0.60 per 1K tokens  
      currency: 'USD'
    },
    'gpt-4o-mini-2024-07-18': {
      promptTokenRate: 0.00015,
      completionTokenRate: 0.0006,
      currency: 'USD'
    },
    'gpt-4o': {
      promptTokenRate: 0.005,       // $5.00 per 1K tokens
      completionTokenRate: 0.015,   // $15.00 per 1K tokens
      currency: 'USD'
    },
    'gpt-3.5-turbo': {
      promptTokenRate: 0.0005,      // $0.50 per 1K tokens
      completionTokenRate: 0.0015,  // $1.50 per 1K tokens
      currency: 'USD'
    }
  };

  /** Calculate total cost in cents for a message (precise decimal) */
  static calculateTotalCost(
    model: string,
    promptTokens: number,
    completionTokens: number
  ): number {
    const breakdown = this.calculateCostBreakdown(model, promptTokens, completionTokens);
    return breakdown.totalCents;
  }

  /** Calculate detailed cost breakdown for a message */
  static calculateCostBreakdown(
    model: string,
    promptTokens: number,
    completionTokens: number
  ): CostBreakdown {
    const pricing = this.getModelPricing(model);
    
    // Convert to cost per token (from per 1K tokens)
    const promptCostPerToken = pricing.promptTokenRate / 1000;
    const completionCostPerToken = pricing.completionTokenRate / 1000;
    
    // Calculate costs in dollars
    const promptCostDollars = promptTokens * promptCostPerToken;
    const completionCostDollars = completionTokens * completionCostPerToken;
    const totalCostDollars = promptCostDollars + completionCostDollars;
    
    // Convert to precise cents (preserve micro-costs)
    const promptTokensCents = promptCostDollars * 100;      // e.g., 0.0822 cents
    const completionTokensCents = completionCostDollars * 100; // e.g., 0.033 cents
    
    // Round individual components first to maintain precision consistency
    const roundedPromptTokensCents = Math.round(promptTokensCents * 10000) / 10000;
    const roundedCompletionTokensCents = Math.round(completionTokensCents * 10000) / 10000;
    
    // Calculate total as sum of rounded components to avoid floating-point precision issues
    const totalCents = roundedPromptTokensCents + roundedCompletionTokensCents;
    
    // For display purposes, round to 4 decimal places (0.0001 cent precision)
    const displayCents = Math.round(totalCents * 10000) / 10000;
    
    return {
      promptTokensCents: roundedPromptTokensCents,
      completionTokensCents: roundedCompletionTokensCents,
      totalCents,
      displayCents,
      modelRate: pricing.promptTokenRate
    };
  }

  /** Get pricing for a specific model */
  private static getModelPricing(model: string): ModelPricing {
    // Normalize model name (remove version suffixes for lookup)
    const normalizedModel = this.normalizeModelName(model);
    
    const pricing = this.MODEL_PRICING[normalizedModel];
    if (!pricing) {
      // Default to gpt-4o-mini pricing for unknown models
      return this.MODEL_PRICING['gpt-4o-mini'];
    }
    
    return pricing;
  }

  /** Normalize model name for pricing lookup */
  private static normalizeModelName(model: string): string {
    // Handle versioned models
    if (model.startsWith('gpt-4o-mini')) {
      return 'gpt-4o-mini';
    }
    if (model.startsWith('gpt-4o')) {
      return 'gpt-4o';
    }
    if (model.startsWith('gpt-3.5-turbo')) {
      return 'gpt-3.5-turbo';
    }
    
    return model;
  }

  /** Calculate estimated cost for a message before sending */
  static estimateCost(model: string, estimatedTokens: number): number {
    const pricing = this.getModelPricing(model);
    const avgTokenRate = (pricing.promptTokenRate + pricing.completionTokenRate) / 2;
    const estimatedCostDollars = (estimatedTokens / 1000) * avgTokenRate;
    
    return Math.round(estimatedCostDollars * 100 * 10000) / 10000; // Return precise cents
  }

  /** Get all supported models with their pricing */
  static getSupportedModels(): Array<{
    model: string;
    pricing: ModelPricing;
    estimatedCostPer1KTokens: number;
  }> {
    return Object.entries(this.MODEL_PRICING).map(([model, pricing]) => ({
      model,
      pricing,
      estimatedCostPer1KTokens: Math.round((pricing.promptTokenRate + pricing.completionTokenRate) / 2 * 100 * 10000) / 10000
    }));
  }

  /** Validate that cost calculation is within reasonable bounds */
  static validateCost(costCents: number, totalTokens: number): boolean {
    // Sanity check: Cost should not exceed $1 per token (100 cents)
    const maxReasonableCostPerToken = 100;
    const maxExpectedCost = totalTokens * maxReasonableCostPerToken;
    
    return costCents <= maxExpectedCost && costCents >= 0;
  }

  /** Format cost for display purposes */
  static formatCostForDisplay(costCents: number): string {
    if (costCents >= 1) {
      return `${costCents.toFixed(2)}¢`;
    } else if (costCents >= 0.01) {
      return `${costCents.toFixed(3)}¢`;
    } else {
      return `${costCents.toFixed(4)}¢`;
    }
  }

  /** Calculate expected cost for given token counts (for testing/validation) */
  static calculateExpectedCost(
    promptTokens: number,
    completionTokens: number,
    model: string = 'gpt-4o-mini'
  ): {
    promptCostCents: number;
    completionCostCents: number;
    totalCostCents: number;
    breakdown: string;
  } {
    const breakdown = this.calculateCostBreakdown(model, promptTokens, completionTokens);
    
    return {
      promptCostCents: breakdown.promptTokensCents,
      completionCostCents: breakdown.completionTokensCents,
      totalCostCents: breakdown.totalCents,
      breakdown: `Prompt: ${promptTokens} tokens × $0.15/1K = ${breakdown.promptTokensCents.toFixed(4)}¢, ` +
                `Completion: ${completionTokens} tokens × $0.60/1K = ${breakdown.completionTokensCents.toFixed(4)}¢, ` +
                `Total: ${breakdown.totalCents.toFixed(4)}¢`
    };
  }
} 