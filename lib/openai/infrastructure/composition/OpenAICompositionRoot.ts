/**
 * OpenAI Composition Root
 *
 * AI INSTRUCTIONS:
 * - This class is responsible for creating and providing a singleton instance of the OpenAIApplicationService.
 * - It ensures that the entire application uses the same rate limiter instance.
 * - Follow the singleton pattern and lazy initialization.
 * - Follow @golden-rule patterns exactly.
 */

import { OpenAIApplicationService } from '../../application/services/OpenAIApplicationService';
import { OpenaiUsageTier } from '../../domain/value-objects/OpenAIRateLimitConfig';

export class OpenAICompositionRoot {
  private static instance: OpenAIApplicationService | null = null;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  public static getInstance(): OpenAIApplicationService {
    if (!OpenAICompositionRoot.instance) {
      // Determine the usage tier from environment variables or a config file.
      // Default to 'tier1' if not specified.
      const usageTier = (process.env.OPENAI_USAGE_TIER as OpenaiUsageTier) || 'tier1';
      
      OpenAICompositionRoot.instance = new OpenAIApplicationService(usageTier);
    }
    return OpenAICompositionRoot.instance;
  }
} 