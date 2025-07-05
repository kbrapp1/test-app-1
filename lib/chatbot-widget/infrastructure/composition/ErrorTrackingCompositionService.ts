import { createClient } from '../../../supabase/server';
import { ErrorCategorizationDomainService } from '../../domain/services/ErrorCategorizationDomainService';
import { ErrorPersistenceService } from '../persistence/supabase/ErrorPersistenceService';
import { ErrorAnalyticsService } from '../../application/services/ErrorAnalyticsService';
import { ErrorTrackingFacade } from '../../application/services/ErrorTrackingFacade';

/**
 * Error Tracking Composition Service
 * 
 * AI INSTRUCTIONS:
 * - Manage error tracking service dependencies and wiring
 * - Maintain single responsibility for error tracking composition
 * - Follow singleton pattern for consistent service instances
 * - Keep under 250 lines following @golden-rule patterns
 * - Delegate complex wiring to separate methods
 * - Handle database configuration automatically
 */
export class ErrorTrackingCompositionService {
  // Error tracking service singletons
  private static errorCategorizationService: ErrorCategorizationDomainService | null = null;
  private static errorPersistenceService: ErrorPersistenceService | null = null;
  private static errorAnalyticsService: ErrorAnalyticsService | null = null;
  private static errorTrackingFacade: ErrorTrackingFacade | null = null;

  /**
   * Get error categorization service singleton
   */
  static getErrorCategorizationService(): ErrorCategorizationDomainService {
    if (!this.errorCategorizationService) {
      this.errorCategorizationService = new ErrorCategorizationDomainService();
    }
    return this.errorCategorizationService;
  }

  /**
   * Get error persistence service singleton
   */
  static getErrorPersistenceService(): ErrorPersistenceService {
    if (!this.errorPersistenceService) {
      const supabase = createClient();
      this.errorPersistenceService = new ErrorPersistenceService(supabase);
    }
    return this.errorPersistenceService;
  }

  /**
   * Get error analytics service singleton
   */
  static getErrorAnalyticsService(): ErrorAnalyticsService {
    if (!this.errorAnalyticsService) {
      const supabase = createClient();
      this.errorAnalyticsService = new ErrorAnalyticsService(supabase);
    }
    return this.errorAnalyticsService;
  }

  /**
   * Get error tracking facade with all dependencies wired
   */
  static getErrorTrackingFacade(): ErrorTrackingFacade {
    if (!this.errorTrackingFacade) {
      this.errorTrackingFacade = this.createErrorTrackingFacade();
    }
    return this.errorTrackingFacade;
  }

  /**
   * Create error tracking facade with proper dependency injection
   */
  private static createErrorTrackingFacade(): ErrorTrackingFacade {
    const categorizationService = this.getErrorCategorizationService();
    const persistenceService = this.getErrorPersistenceService();
    const analyticsService = this.getErrorAnalyticsService();
    
    return new ErrorTrackingFacade(
      categorizationService,
      persistenceService,
      analyticsService
    );
  }

  /**
   * Reset all error tracking services for testing
   */
  static reset(): void {
    this.errorCategorizationService = null;
    this.errorPersistenceService = null;
    this.errorAnalyticsService = null;
    this.errorTrackingFacade = null;
  }
} 