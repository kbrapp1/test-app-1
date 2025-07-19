// Domain services imports
import { UserContentSanitizationService } from '../../../domain/services/content-processing/UserContentSanitizationService';
import { ContentValidationService } from '../../../domain/services/content-processing/ContentValidationService';
import { ContentLengthValidationService } from '../../../domain/services/content-processing/ContentLengthValidationService';
import { ContentTypeValidationService } from '../../../domain/services/content-processing/ContentTypeValidationService';

// Domain errors
import { BusinessRuleViolationError } from '../../../domain/errors/base/DomainErrorBase';

/**
 * Content Processing Composition Service
 * 
 * AI INSTRUCTIONS:
 * - Centralized factory for content processing domain services
 * - Follow @golden-rule domain service composition patterns
 * - Singleton pattern for stateless domain services only
 * - Provide error handling for all service initialization
 * - Single responsibility: Content processing service instantiation
 * - Keep under 250 lines - focused on content processing concerns only
 * - Never return null - always provide valid service instances
 */
export class ContentProcessingCompositionService {
  // ===== SINGLETON INSTANCES FOR STATELESS DOMAIN SERVICES =====
  
  private static userContentSanitizationService: UserContentSanitizationService | null = null;
  private static contentValidationService: ContentValidationService | null = null;
  private static contentLengthValidationService: ContentLengthValidationService | null = null;
  private static contentTypeValidationService: ContentTypeValidationService | null = null;

  // ===== DOMAIN SERVICE FACTORIES =====

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

  /** Get Content Validation Service */
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

  /** Get Content Type Validation Service */
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

  // ===== CACHE MANAGEMENT METHODS =====

  /**
   * Clear all cached content processing service instances
   * 
   * AI INSTRUCTIONS:
   * - Complete cache reset for testing scenarios
   * - Follow @golden-rule testing support patterns
   * - Reset all singleton instances
   */
  static clearCache(): void {
    this.userContentSanitizationService = null;
    this.contentValidationService = null;
    this.contentLengthValidationService = null;
    this.contentTypeValidationService = null;
  }

  /**
   * Get Content Processing Service Statistics
   * 
   * AI INSTRUCTIONS:
   * - Follow @golden-rule monitoring and observability patterns
   * - Provide insights into service initialization state
   * - Help with debugging and health checks
   */
  static getServiceStatistics(): {
    userContentSanitizationServiceInitialized: boolean;
    contentValidationServiceInitialized: boolean;
    contentLengthValidationServiceInitialized: boolean;
    contentTypeValidationServiceInitialized: boolean;
    servicesInitialized: number;
    totalServices: number;
  } {
    const initialized = [
      this.userContentSanitizationService !== null,
      this.contentValidationService !== null,
      this.contentLengthValidationService !== null,
      this.contentTypeValidationService !== null
    ];
    
    return {
      userContentSanitizationServiceInitialized: this.userContentSanitizationService !== null,
      contentValidationServiceInitialized: this.contentValidationService !== null,
      contentLengthValidationServiceInitialized: this.contentLengthValidationService !== null,
      contentTypeValidationServiceInitialized: this.contentTypeValidationService !== null,
      servicesInitialized: initialized.filter(Boolean).length,
      totalServices: initialized.length
    };
  }

  /** Health check for all content processing services */
  static async healthCheck(): Promise<{
    userContentSanitizationService: boolean;
    contentValidationService: boolean;
    contentLengthValidationService: boolean;
    contentTypeValidationService: boolean;
    overall: boolean;
  }> {
    const results = {
      userContentSanitizationService: false,
      contentValidationService: false,
      contentLengthValidationService: false,
      contentTypeValidationService: false,
      overall: false
    };

    try {
      const userContentSanitizationService = this.getUserContentSanitizationService();
      results.userContentSanitizationService = !!userContentSanitizationService;
    } catch {
      // Service failed to initialize
    }

    try {
      const contentValidationService = this.getContentValidationService();
      results.contentValidationService = !!contentValidationService;
    } catch {
      // Service failed to initialize
    }

    try {
      const contentLengthValidationService = this.getContentLengthValidationService();
      results.contentLengthValidationService = !!contentLengthValidationService;
    } catch {
      // Service failed to initialize
    }

    try {
      const contentTypeValidationService = this.getContentTypeValidationService();
      results.contentTypeValidationService = !!contentTypeValidationService;
    } catch {
      // Service failed to initialize
    }

    results.overall = Object.values(results).slice(0, -1).every(Boolean);

    return results;
  }
}