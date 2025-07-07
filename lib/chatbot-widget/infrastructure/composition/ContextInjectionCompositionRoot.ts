/**
 * Context Injection Composition Root
 * 
 * AI INSTRUCTIONS:
 * - Wire all dependencies for context injection domain
 * - Use singleton pattern for service instances
 * - Follow @golden-rule dependency injection patterns
 * - Lazy initialization for performance
 * - Keep under 200 lines by focusing on wiring only
 */

import { ContextEffectivenessDomainService } from '../../domain/services/context-injection/ContextEffectivenessDomainService';
import { ContextRecommendationDomainService } from '../../domain/services/context-injection/ContextRecommendationDomainService';
import { ContextInjectionApplicationService } from '../../application/services/ContextInjectionApplicationService';

/**
 * Context Injection Composition Root
 * 
 * AI INSTRUCTIONS:
 * - Central dependency injection for context injection domain
 * - Manage service lifetimes and dependencies
 * - Provide clean access to all services
 * - Implement singleton pattern for performance
 */
export class ContextInjectionCompositionRoot {
  private static instance: ContextInjectionCompositionRoot;
  
  // Domain Services (only non-static ones)
  private _contextEffectivenessService?: ContextEffectivenessDomainService;
  private _contextRecommendationService?: ContextRecommendationDomainService;
  
  // Application Services
  private _contextInjectionApplicationService?: ContextInjectionApplicationService;
  
  private constructor() {
    // AI: Private constructor for singleton pattern
  }
  
  /**
   * Get singleton instance of composition root
   * 
   * AI INSTRUCTIONS:
   * - Implement thread-safe singleton pattern
   * - Lazy initialization for performance
   */
  public static getInstance(): ContextInjectionCompositionRoot {
    if (!ContextInjectionCompositionRoot.instance) {
      ContextInjectionCompositionRoot.instance = new ContextInjectionCompositionRoot();
    }
    return ContextInjectionCompositionRoot.instance;
  }
  
  /**
   * Domain Service Getters
   * 
   * AI INSTRUCTIONS:
   * - Lazy initialization for each service
   * - Return same instance for singleton behavior
   * - Wire dependencies as needed
   */
  
  public getContextEffectivenessService(): ContextEffectivenessDomainService {
    if (!this._contextEffectivenessService) {
      this._contextEffectivenessService = new ContextEffectivenessDomainService();
    }
    return this._contextEffectivenessService;
  }
  
  public getContextRecommendationService(): ContextRecommendationDomainService {
    if (!this._contextRecommendationService) {
      this._contextRecommendationService = new ContextRecommendationDomainService();
    }
    return this._contextRecommendationService;
  }
  
  /**
   * Application Service Getters
   * 
   * AI INSTRUCTIONS:
   * - Wire application services with domain dependencies
   * - Inject all required domain services
   * - Maintain singleton behavior
   */
  public getContextInjectionApplicationService(): ContextInjectionApplicationService {
    if (!this._contextInjectionApplicationService) {
      this._contextInjectionApplicationService = new ContextInjectionApplicationService(
        this.getContextEffectivenessService(),
        this.getContextRecommendationService()
      );
    }
    return this._contextInjectionApplicationService;
  }
  
  /**
   * Reset method for testing
   * 
   * AI INSTRUCTIONS:
   * - Allow clean state for unit tests
   * - Reset all cached instances
   * - Use only in test environments
   */
  public static reset(): void {
    ContextInjectionCompositionRoot.instance = new ContextInjectionCompositionRoot();
  }
}