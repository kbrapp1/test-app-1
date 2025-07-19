// Domain services imports
import { SessionContextService } from '../../../domain/services/session-management/SessionContextService';
import { SessionStateService } from '../../../domain/services/session-management/SessionStateService';
import { ChatSessionValidationService } from '../../../domain/services/session-management/ChatSessionValidationService';
import { SessionLeadQualificationService } from '../../../domain/services/session-management/SessionLeadQualificationService';

// Domain errors
import { BusinessRuleViolationError } from '../../../domain/errors/base/DomainErrorBase';

/**
 * Session Management Composition Service
 * 
 * AI INSTRUCTIONS:
 * - Centralized factory for session management domain services
 * - Follow @golden-rule domain service composition patterns
 * - Singleton pattern for stateless domain services only
 * - Provide error handling for all service initialization
 * - Single responsibility: Session management service instantiation
 * - Keep under 250 lines - focused on session concerns only
 * - Never return null - always provide valid service instances
 */
export class SessionManagementCompositionService {
  // ===== SINGLETON INSTANCES FOR STATELESS DOMAIN SERVICES =====
  
  private static sessionContextService: SessionContextService | null = null;
  private static sessionStateService: SessionStateService | null = null;

  // ===== DOMAIN SERVICE FACTORIES =====

  /**
   * Get Session Context Service
   * 
   * AI INSTRUCTIONS:
   * - Singleton pattern for stateless domain service
   * - Follow @golden-rule domain service composition patterns
   * - Provide error handling for service initialization
   */
  static getSessionContextService(): SessionContextService {
    if (!this.sessionContextService) {
      try {
        this.sessionContextService = new SessionContextService();
      } catch (error) {
        throw new BusinessRuleViolationError(
          'Failed to initialize session context service',
          { error: error instanceof Error ? error.message : 'Unknown error' }
        );
      }
    }
    return this.sessionContextService;
  }

  /**
   * Get Session State Service
   * 
   * AI INSTRUCTIONS:
   * - Singleton pattern for stateless domain service
   * - Follow @golden-rule domain service composition patterns
   * - Provide error handling for service initialization
   */
  static getSessionStateService(): SessionStateService {
    if (!this.sessionStateService) {
      try {
        this.sessionStateService = new SessionStateService();
      } catch (error) {
        throw new BusinessRuleViolationError(
          'Failed to initialize session state service',
          { error: error instanceof Error ? error.message : 'Unknown error' }
        );
      }
    }
    return this.sessionStateService;
  }

  // ===== STATIC DOMAIN SERVICE ACCESS METHODS =====
  
  /**
   * Get Chat Session Validation Service
   * 
   * AI INSTRUCTIONS:
   * - Return static service class for validation utilities
   * - Follow @golden-rule domain service patterns
   * - No instantiation needed for pure utility services
   */
  static getChatSessionValidationService(): typeof ChatSessionValidationService {
    return ChatSessionValidationService;
  }

  /** Get Session Lead Qualification Service */
  static getSessionLeadQualificationService(): typeof SessionLeadQualificationService {
    return SessionLeadQualificationService;
  }

  // ===== CACHE MANAGEMENT METHODS =====

  /**
   * Clear all cached session management service instances
   * 
   * AI INSTRUCTIONS:
   * - Complete cache reset for testing scenarios
   * - Follow @golden-rule testing support patterns
   * - Reset all singleton instances
   */
  static clearCache(): void {
    this.sessionContextService = null;
    this.sessionStateService = null;
  }

  /**
   * Get Session Management Service Statistics
   * 
   * AI INSTRUCTIONS:
   * - Follow @golden-rule monitoring and observability patterns
   * - Provide insights into service initialization state
   * - Help with debugging and health checks
   */
  static getServiceStatistics(): {
    sessionContextServiceInitialized: boolean;
    sessionStateServiceInitialized: boolean;
    servicesInitialized: number;
    totalServices: number;
  } {
    const initialized = [
      this.sessionContextService !== null,
      this.sessionStateService !== null
    ];
    
    return {
      sessionContextServiceInitialized: this.sessionContextService !== null,
      sessionStateServiceInitialized: this.sessionStateService !== null,
      servicesInitialized: initialized.filter(Boolean).length,
      totalServices: initialized.length
    };
  }

  /** Health check for all session management services */
  static async healthCheck(): Promise<{
    sessionContextService: boolean;
    sessionStateService: boolean;
    overall: boolean;
  }> {
    const results = {
      sessionContextService: false,
      sessionStateService: false,
      overall: false
    };

    try {
      const sessionContextService = this.getSessionContextService();
      results.sessionContextService = !!sessionContextService;
    } catch {
      // Service failed to initialize
    }

    try {
      const sessionStateService = this.getSessionStateService();
      results.sessionStateService = !!sessionStateService;
    } catch {
      // Service failed to initialize
    }

    results.overall = Object.values(results).slice(0, -1).every(Boolean);

    return results;
  }
}