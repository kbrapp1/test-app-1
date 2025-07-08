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

/** Context Injection Composition Root */
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
  
  /** Get singleton instance of composition root */
  public static getInstance(): ContextInjectionCompositionRoot {
    if (!ContextInjectionCompositionRoot.instance) {
      ContextInjectionCompositionRoot.instance = new ContextInjectionCompositionRoot();
    }
    return ContextInjectionCompositionRoot.instance;
  }
  
  /** Domain Service Getters */
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
  
  /** Application Service Getters */
  public getContextInjectionApplicationService(): ContextInjectionApplicationService {
    if (!this._contextInjectionApplicationService) {
      this._contextInjectionApplicationService = new ContextInjectionApplicationService(
        this.getContextEffectivenessService(),
        this.getContextRecommendationService()
      );
    }
    return this._contextInjectionApplicationService;
  }
  
  /** Reset method for testing */
  public static reset(): void {
    ContextInjectionCompositionRoot.instance = new ContextInjectionCompositionRoot();
  }
}