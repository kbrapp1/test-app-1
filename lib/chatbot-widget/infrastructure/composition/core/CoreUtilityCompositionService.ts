// Domain services imports
import { ContextWindowService } from '../../../domain/services/utilities/ContextWindowService';
import { EntityAccumulationService } from '../../../domain/services/context/EntityAccumulationService';

// Domain service interfaces
import { ITokenCountingService } from '../../../domain/services/interfaces/ITokenCountingService';

// Composition services
import { InfrastructureServiceCompositionService } from './InfrastructureServiceCompositionService';

// Domain errors
import { BusinessRuleViolationError } from '../../../domain/errors/base/DomainErrorBase';

/**
 * Core Utility Composition Service
 * 
 * AI INSTRUCTIONS:
 * - Centralized factory for core utility domain services
 * - Follow @golden-rule domain service composition patterns
 * - Singleton pattern for stateless domain services only
 * - Provide error handling for all service initialization
 * - Single responsibility: Core utility service instantiation
 * - Keep under 250 lines - focused on utility concerns only
 * - Never return null - always provide valid service instances
 */
export class CoreUtilityCompositionService {
  // ===== SINGLETON INSTANCES FOR STATELESS DOMAIN SERVICES =====
  
  private static contextWindowService: ContextWindowService | null = null;

  // ===== DOMAIN SERVICE FACTORIES =====

  /** Get Context Window Service */
  static getContextWindowService(tokenCountingService?: ITokenCountingService): ContextWindowService {
    if (!this.contextWindowService) {
      // Use provided service or get from infrastructure composition service
      const tokenService = tokenCountingService || InfrastructureServiceCompositionService.getTokenCountingService();
      
      if (!tokenService) {
        throw new BusinessRuleViolationError(
          'Token counting service is required for context window service',
          { service: 'ContextWindowService', dependency: 'ITokenCountingService' }
        );
      }
      
      try {
        this.contextWindowService = new ContextWindowService(tokenService);
      } catch (error) {
        throw new BusinessRuleViolationError(
          'Failed to initialize context window service',
          { error: error instanceof Error ? error.message : 'Unknown error' }
        );
      }
    }
    return this.contextWindowService;
  }

  // ===== STATIC DOMAIN SERVICE ACCESS METHODS =====
  
  /** Get Entity Accumulation Service */
  static getEntityAccumulationService(): typeof EntityAccumulationService {
    return EntityAccumulationService;
  }

  // ===== CACHE MANAGEMENT METHODS =====

  /**
   * Clear all cached core utility service instances
   * 
   * AI INSTRUCTIONS:
   * - Complete cache reset for testing scenarios
   * - Follow @golden-rule testing support patterns
   * - Reset all singleton instances
   */
  static clearCache(): void {
    this.contextWindowService = null;
  }

  /**
   * Get Core Utility Service Statistics
   * 
   * AI INSTRUCTIONS:
   * - Follow @golden-rule monitoring and observability patterns
   * - Provide insights into service initialization state
   * - Help with debugging and health checks
   */
  static getServiceStatistics(): {
    contextWindowServiceInitialized: boolean;
    servicesInitialized: number;
    totalServices: number;
  } {
    const initialized = [
      this.contextWindowService !== null
    ];
    
    return {
      contextWindowServiceInitialized: this.contextWindowService !== null,
      servicesInitialized: initialized.filter(Boolean).length,
      totalServices: initialized.length
    };
  }

  /** Health check for all core utility services */
  static async healthCheck(): Promise<{
    contextWindowService: boolean;
    overall: boolean;
  }> {
    const results = {
      contextWindowService: false,
      overall: false
    };

    try {
      const contextWindowService = this.getContextWindowService();
      results.contextWindowService = !!contextWindowService;
    } catch {
      // Service failed to initialize
    }

    results.overall = Object.values(results).slice(0, -1).every(Boolean);

    return results;
  }
}