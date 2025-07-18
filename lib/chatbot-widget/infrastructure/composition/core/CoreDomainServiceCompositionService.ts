// Domain services imports
import { SessionContextService } from '../../../domain/services/session-management/SessionContextService';
import { SessionStateService } from '../../../domain/services/session-management/SessionStateService';
import { ChatSessionValidationService } from '../../../domain/services/session-management/ChatSessionValidationService';
import { SessionLeadQualificationService } from '../../../domain/services/session-management/SessionLeadQualificationService';
import { ContextWindowService } from '../../../domain/services/utilities/ContextWindowService';
import { EntityAccumulationService } from '../../../domain/services/context/EntityAccumulationService';
import { LeadExtractionService } from '../../../domain/services/lead-management/LeadExtractionService';
import { KnowledgeBaseFormService } from '../../../domain/services/knowledge-processing/KnowledgeBaseFormService';
import { UserContentSanitizationService } from '../../../domain/services/content-processing/UserContentSanitizationService';
import { ContentValidationService } from '../../../domain/services/content-processing/ContentValidationService';
import { ContentLengthValidationService } from '../../../domain/services/content-processing/ContentLengthValidationService';
import { ContentTypeValidationService } from '../../../domain/services/content-processing/ContentTypeValidationService';

// Domain service interfaces
import { ITokenCountingService } from '../../../domain/services/interfaces/ITokenCountingService';

// Composition services
import { InfrastructureServiceCompositionService } from './InfrastructureServiceCompositionService';

// Domain errors
import { BusinessRuleViolationError } from '../../../domain/errors/base/DomainErrorBase';

/**
 * Core Domain Service Composition Service
 * 
 * AI INSTRUCTIONS:
 * - Centralized factory for core domain services (stateless singletons)
 * - Follow @golden-rule domain service composition patterns
 * - Singleton pattern for stateless domain services only
 * - Provide error handling for all service initialization
 * - Single responsibility: Core domain service instantiation
 * - Keep under 250 lines - focused on core domain services only
 * - Never return null - always provide valid service instances
 * - Delegate infrastructure concerns to specialized services
 */
export class CoreDomainServiceCompositionService {
  // ===== SINGLETON INSTANCES FOR STATELESS DOMAIN SERVICES =====
  
  private static sessionContextService: SessionContextService | null = null;
  private static sessionStateService: SessionStateService | null = null;
  private static contextWindowService: ContextWindowService | null = null;
  private static leadExtractionService: LeadExtractionService | null = null;
  private static knowledgeBaseFormService: KnowledgeBaseFormService | null = null;
  private static userContentSanitizationService: UserContentSanitizationService | null = null;
  private static contentValidationService: ContentValidationService | null = null;
  private static contentLengthValidationService: ContentLengthValidationService | null = null;
  private static contentTypeValidationService: ContentTypeValidationService | null = null;

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

  /** Get Context Window Service */
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

  /**
   * Get Lead Extraction Service
   * 
   * AI INSTRUCTIONS:
   * - Singleton pattern for stateless domain service
   * - Follow @golden-rule domain service composition patterns
   * - Provide error handling for service initialization
   */
  static getLeadExtractionService(): LeadExtractionService {
    if (!this.leadExtractionService) {
      try {
        this.leadExtractionService = new LeadExtractionService();
      } catch (error) {
        throw new BusinessRuleViolationError(
          'Failed to initialize lead extraction service',
          { error: error instanceof Error ? error.message : 'Unknown error' }
        );
      }
    }
    return this.leadExtractionService;
  }

  /** Get Knowledge Base Form Service */
  static getKnowledgeBaseFormService(): KnowledgeBaseFormService {
    if (!this.knowledgeBaseFormService) {
      try {
        this.knowledgeBaseFormService = new KnowledgeBaseFormService();
      } catch (error) {
        throw new BusinessRuleViolationError(
          'Failed to initialize knowledge base form service',
          { error: error instanceof Error ? error.message : 'Unknown error' }
        );
      }
    }
    return this.knowledgeBaseFormService;
  }

  /**
   * Get User Content Sanitization Service
   * 
   * AI INSTRUCTIONS:
   * - Singleton pattern for stateless domain service
   * - Follow @golden-rule domain service composition patterns
   * - Provide error handling for service initialization
   */
  static getUserContentSanitizationService(): UserContentSanitizationService {
    if (!this.userContentSanitizationService) {
      try {
        this.userContentSanitizationService = new UserContentSanitizationService();
      } catch (error) {
        throw new BusinessRuleViolationError(
          'Failed to initialize user content sanitization service',
          { error: error instanceof Error ? error.message : 'Unknown error' }
        );
      }
    }
    return this.userContentSanitizationService;
  }

  /** Get Content Validation Service */
  static getContentValidationService(): ContentValidationService {
    if (!this.contentValidationService) {
      try {
        this.contentValidationService = new ContentValidationService();
      } catch (error) {
        throw new BusinessRuleViolationError(
          'Failed to initialize content validation service',
          { error: error instanceof Error ? error.message : 'Unknown error' }
        );
      }
    }
    return this.contentValidationService;
  }

  /**
   * Get Content Length Validation Service
   * 
   * AI INSTRUCTIONS:
   * - Singleton pattern for stateless domain service
   * - Follow @golden-rule domain service composition patterns
   * - Provide error handling for service initialization
   */
  static getContentLengthValidationService(): ContentLengthValidationService {
    if (!this.contentLengthValidationService) {
      try {
        this.contentLengthValidationService = new ContentLengthValidationService();
      } catch (error) {
        throw new BusinessRuleViolationError(
          'Failed to initialize content length validation service',
          { error: error instanceof Error ? error.message : 'Unknown error' }
        );
      }
    }
    return this.contentLengthValidationService;
  }

  /** Get Content Type Validation Service */
  static getContentTypeValidationService(): ContentTypeValidationService {
    if (!this.contentTypeValidationService) {
      try {
        this.contentTypeValidationService = new ContentTypeValidationService();
      } catch (error) {
        throw new BusinessRuleViolationError(
          'Failed to initialize content type validation service',
          { error: error instanceof Error ? error.message : 'Unknown error' }
        );
      }
    }
    return this.contentTypeValidationService;
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

  /** Get Session Lead Qualification Service */
  static getSessionLeadQualificationService(): typeof SessionLeadQualificationService {
    return SessionLeadQualificationService;
  }

  /** Get Entity Accumulation Service */
  static getEntityAccumulationService(): typeof EntityAccumulationService {
    return EntityAccumulationService;
  }

  // ===== CACHE MANAGEMENT METHODS =====

  /**
   * Clear all cached domain service instances
   * 
   * AI INSTRUCTIONS:
   * - Complete cache reset for testing scenarios
   * - Follow @golden-rule testing support patterns
   * - Reset all singleton instances
   */
  static clearCache(): void {
    this.sessionContextService = null;
    this.sessionStateService = null;
    this.contextWindowService = null;
    this.leadExtractionService = null;
    this.knowledgeBaseFormService = null;
  }

  /**
   * Get Domain Service Statistics
   * 
   * AI INSTRUCTIONS:
   * - Follow @golden-rule monitoring and observability patterns
   * - Provide insights into service initialization state
   * - Help with debugging and health checks
   */
  static getServiceStatistics(): {
    sessionContextServiceInitialized: boolean;
    sessionStateServiceInitialized: boolean;
    contextWindowServiceInitialized: boolean;
    leadExtractionServiceInitialized: boolean;
    knowledgeBaseFormServiceInitialized: boolean;
    servicesInitialized: number;
    totalServices: number;
  } {
    const initialized = [
      this.sessionContextService !== null,
      this.sessionStateService !== null,
      this.contextWindowService !== null,
      this.leadExtractionService !== null,
      this.knowledgeBaseFormService !== null
    ];
    
    return {
      sessionContextServiceInitialized: this.sessionContextService !== null,
      sessionStateServiceInitialized: this.sessionStateService !== null,
      contextWindowServiceInitialized: this.contextWindowService !== null,
      leadExtractionServiceInitialized: this.leadExtractionService !== null,
      knowledgeBaseFormServiceInitialized: this.knowledgeBaseFormService !== null,
      servicesInitialized: initialized.filter(Boolean).length,
      totalServices: initialized.length
    };
  }

  /** Health check for all core domain services */
  static async healthCheck(): Promise<{
    sessionContextService: boolean;
    sessionStateService: boolean;
    contextWindowService: boolean;
    leadExtractionService: boolean;
    knowledgeBaseFormService: boolean;
    overall: boolean;
  }> {
    const results = {
      sessionContextService: false,
      sessionStateService: false,
      contextWindowService: false,
      leadExtractionService: false,
      knowledgeBaseFormService: false,
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

    try {
      const contextWindowService = this.getContextWindowService();
      results.contextWindowService = !!contextWindowService;
    } catch {
      // Service failed to initialize
    }

    try {
      const leadExtractionService = this.getLeadExtractionService();
      results.leadExtractionService = !!leadExtractionService;
    } catch {
      // Service failed to initialize
    }

    try {
      const knowledgeBaseFormService = this.getKnowledgeBaseFormService();
      results.knowledgeBaseFormService = !!knowledgeBaseFormService;
    } catch {
      // Service failed to initialize
    }

    results.overall = Object.values(results).slice(0, -1).every(Boolean);

    return results;
  }
}