// Domain service interfaces
import { ITokenCountingService } from '../../../domain/services/interfaces/ITokenCountingService';
import { IIntentClassificationService } from '../../../domain/services/interfaces/IIntentClassificationService';
import { IDebugInformationService } from '../../../domain/services/interfaces/IDebugInformationService';

// Infrastructure service implementations
import { OpenAITokenCountingService } from '../../providers/openai/OpenAITokenCountingService';
import { OpenAIIntentClassificationService } from '../../providers/openai/OpenAIIntentClassificationService';
import { DebugInformationService } from '../../services/DebugInformationService';

// Domain errors
import { BusinessRuleViolationError } from '../../../domain/errors/base/DomainErrorBase';

/**
 * Infrastructure Service Composition Service
 * 
 * AI INSTRUCTIONS:
 * - Centralized factory for infrastructure service implementations
 * - Singleton pattern for stateless infrastructure services per @golden-rule
 * - Use domain errors for configuration validation failures
 * - Follow @golden-rule dependency injection patterns
 * - Single responsibility: Infrastructure service instantiation and configuration
 * - Keep under 250 lines - focused on infrastructure concerns only
 * - Validate configurations before service creation
 * - Never return null - always provide valid service instances
 */
export class InfrastructureServiceCompositionService {
  // ===== SINGLETON INSTANCES FOR STATELESS INFRASTRUCTURE SERVICES =====
  
  private static tokenCountingService: ITokenCountingService | null = null;
  private static debugInformationService: IDebugInformationService | null = null;

  // ===== INFRASTRUCTURE SERVICE FACTORIES =====
  
  /** Get Token Counting Service */
  static getTokenCountingService(): ITokenCountingService {
    if (!this.tokenCountingService) {
      try {
        this.tokenCountingService = new OpenAITokenCountingService();
      } catch (error) {
        throw new BusinessRuleViolationError(
          'Failed to initialize token counting service',
          { error: error instanceof Error ? error.message : 'Unknown error' } as Record<string, unknown>
        );
      }
    }
    return this.tokenCountingService;
  }

  /** Get Intent Classification Service */
  static async getIntentClassificationService(): Promise<IIntentClassificationService> {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new BusinessRuleViolationError(
        'OpenAI API key is required for intent classification',
        { service: 'IntentClassificationService', configMissing: 'OPENAI_API_KEY' } as Record<string, unknown>
      );
    }

    const config = {
      apiKey,
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 1000
    };
    
    try {
      return new OpenAIIntentClassificationService(config);
    } catch (error) {
      throw new BusinessRuleViolationError(
        'Failed to initialize intent classification service',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          config: { model: config.model, temperature: config.temperature }
        } as Record<string, unknown>
      );
    }
  }

  /**
   * Get Debug Information Service
   * 
   * AI INSTRUCTIONS:
   * - Singleton pattern for stateless debug service
   * - Follow @golden-rule dependency injection patterns
   * - Provide error handling for service initialization
   */
  static getDebugInformationService(): IDebugInformationService {
    if (!this.debugInformationService) {
      try {
        this.debugInformationService = new DebugInformationService();
      } catch (error) {
        throw new BusinessRuleViolationError(
          'Failed to initialize debug information service',
          { error: error instanceof Error ? error.message : 'Unknown error' } as Record<string, unknown>
        );
      }
    }
    return this.debugInformationService;
  }

  // ===== CACHE MANAGEMENT METHODS =====

  /**
   * Clear all cached infrastructure service instances
   * 
   * AI INSTRUCTIONS:
   * - Reset for testing scenarios per @golden-rule
   * - Clear all singleton instances
   * - Support clean test environments
   */
  static clearCache(): void {
    this.tokenCountingService = null;
    this.debugInformationService = null;
    
    // Clear dynamic import caches to prevent memory leaks
    this.clearDynamicImportCaches();
  }

  /** Clear dynamic import caches */
  private static clearDynamicImportCaches(): void {
    try {
      // Clear OpenAI service caches using globalThis to avoid module resolution issues
      if (typeof globalThis !== 'undefined') {
        // Clear tiktoken cache
        const tiktokenCacheKey = 'OpenAITokenCountingService_tiktokenCache';
        if ((globalThis as Record<string, unknown>)[tiktokenCacheKey]) {
          (globalThis as Record<string, unknown>)[tiktokenCacheKey] = null;
        }

        // Clear logging service cache
        const loggingCacheKey = 'OpenAIChatbotProcessingService_loggingServiceCache';
        if ((globalThis as Record<string, unknown>)[loggingCacheKey]) {
          (globalThis as Record<string, unknown>)[loggingCacheKey] = null;
        }

        // Clear conversation context orchestrator cache
        const contextCacheKey = 'UseCaseCompositionService_conversationContextOrchestratorCache';
        if ((globalThis as Record<string, unknown>)[contextCacheKey]) {
          (globalThis as Record<string, unknown>)[contextCacheKey] = null;
        }
      }
    } catch (error) {
      // Silently handle any cache clearing errors to prevent breaking the main flow
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to clear dynamic import caches:', error);
      }
    }
  }

  /**
   * Get Infrastructure Service Statistics
   * 
   * AI INSTRUCTIONS:
   * - Follow @golden-rule monitoring and observability patterns
   * - Provide insights into service initialization state
   * - Help with debugging and health checks
   */
  static getServiceStatistics(): {
    tokenCountingServiceInitialized: boolean;
    debugInformationServiceInitialized: boolean;
    servicesInitialized: number;
    totalServices: number;
  } {
    const initialized = [
      this.tokenCountingService !== null,
      this.debugInformationService !== null
    ];
    
    return {
      tokenCountingServiceInitialized: this.tokenCountingService !== null,
      debugInformationServiceInitialized: this.debugInformationService !== null,
      servicesInitialized: initialized.filter(Boolean).length,
      totalServices: initialized.length
    };
  }

  /** Health check for all infrastructure services */
  static async healthCheck(): Promise<{
    tokenCountingService: boolean;
    debugInformationService: boolean;
    intentClassificationService: boolean;
    overall: boolean;
  }> {
    const results = {
      tokenCountingService: false,
      debugInformationService: false,
      intentClassificationService: false,
      overall: false
    };

    try {
      // Check token counting service
      const tokenService = this.getTokenCountingService();
      results.tokenCountingService = !!tokenService;
    } catch {
      // Service failed to initialize
    }

    try {
      // Check debug information service
      const debugService = this.getDebugInformationService();
      results.debugInformationService = !!debugService;
    } catch {
      // Service failed to initialize
    }

    try {
      // Check intent classification service (requires API key)
      if (process.env.OPENAI_API_KEY) {
        const intentService = await this.getIntentClassificationService();
        results.intentClassificationService = !!intentService;
      }
    } catch {
      // Service failed to initialize or API key missing
    }

    results.overall = results.tokenCountingService && 
                      results.debugInformationService && 
                      results.intentClassificationService;

    return results;
  }
}