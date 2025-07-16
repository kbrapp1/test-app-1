/**
 * Website Validation Service
 * 
 * AI INSTRUCTIONS:
 * - Application layer service for website source validation
 * - Handles validation logic for crawling readiness and accessibility
 * - Never exceed 250 lines - single responsibility principle
 * - Follow @golden-rule patterns exactly
 * - Use domain-specific error types, no generic errors
 * - Delegate complex validation to domain services when needed
 * - Maintain clean separation of validation concerns
 */

import { WebsiteSource } from '../../domain/value-objects/ai-configuration/KnowledgeBase';
import { BusinessRuleViolationError } from '../../domain/errors/ChatbotWidgetDomainErrors';

export interface WebsiteValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CrawlRequestValidation {
  organizationId: string;
  chatbotConfigId: string;
  websiteSource: WebsiteSource;
  forceRefresh?: boolean;
}

export interface UpdateRequestValidation {
  organizationId: string;
  chatbotConfigId: string;
  websiteSources: WebsiteSource[];
  forceRefresh?: boolean;
}

export class WebsiteValidationService {
  
  /**
   * Validate website source for crawling readiness
   * 
   * AI INSTRUCTIONS:
   * - Check website source configuration and accessibility
   * - Validate crawl settings against business rules
   * - Return validation results for UI feedback
   * - Use domain-specific error types
   */
  async validateWebsiteSource(websiteSource: WebsiteSource): Promise<WebsiteValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Basic validation
      this.validateBasicConfiguration(websiteSource, errors);
      
      // Crawl settings validation
      this.validateCrawlSettings(websiteSource, errors, warnings);
      
      // Performance warnings
      this.addPerformanceWarnings(websiteSource, warnings);

      // Connectivity check
      if (websiteSource.url && this.isValidUrl(websiteSource.url)) {
        try {
          const isAccessible = await this.checkWebsiteAccessibility(websiteSource.url);
          if (!isAccessible) {
            errors.push('Website is not accessible or blocks crawlers');
          }
        } catch {
          warnings.push('Could not verify website accessibility - proceeding with caution');
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings
      };
    }
  }

  /** Validate crawl request against business rules */
  validateCrawlRequest(request: CrawlRequestValidation): void {
    if (!request.organizationId?.trim()) {
      throw new BusinessRuleViolationError(
        'Organization ID is required for website crawling',
        { request }
      );
    }

    if (!request.chatbotConfigId?.trim()) {
      throw new BusinessRuleViolationError(
        'Chatbot config ID is required for website crawling',
        { request }
      );
    }

    if (!request.websiteSource) {
      throw new BusinessRuleViolationError(
        'Website source is required for crawling',
        { request }
      );
    }

    // Only check if source is active when not forcing refresh
    if (!request.websiteSource.isActive && !request.forceRefresh) {
      throw new BusinessRuleViolationError(
        'Cannot crawl inactive website source',
        { sourceId: request.websiteSource.id }
      );
    }
  }

  /**
   * Validate batch update request
   * 
   * AI INSTRUCTIONS:
   * - Validate batch operation constraints
   * - Check source limits and permissions
   * - Ensure proper resource allocation
   */
  validateUpdateRequest(request: UpdateRequestValidation): void {
    if (!request.organizationId?.trim()) {
      throw new BusinessRuleViolationError(
        'Organization ID is required for knowledge update',
        { request }
      );
    }

    if (!request.chatbotConfigId?.trim()) {
      throw new BusinessRuleViolationError(
        'Chatbot config ID is required for knowledge update',
        { request }
      );
    }

    if (!request.websiteSources || request.websiteSources.length === 0) {
      throw new BusinessRuleViolationError(
        'At least one website source is required for knowledge update',
        { request }
      );
    }

    if (request.websiteSources.length > 10) {
      throw new BusinessRuleViolationError(
        'Cannot process more than 10 website sources in a single batch',
        { sourceCount: request.websiteSources.length }
      );
    }
  }

  /** Validate basic website source configuration */
  private validateBasicConfiguration(websiteSource: WebsiteSource, errors: string[]): void {
    if (!websiteSource.url || !this.isValidUrl(websiteSource.url)) {
      errors.push('Invalid or missing website URL');
    }

    if (!websiteSource.name?.trim()) {
      errors.push('Website source name is required');
    }
  }

  /**
   * Validate crawl settings against business rules
   * 
   * AI INSTRUCTIONS:
   * - Enforce crawling limits and constraints
   * - Check depth and page count limits
   * - Add both errors and warnings as appropriate
   */
  private validateCrawlSettings(
    websiteSource: WebsiteSource, 
    errors: string[], 
    _warnings: string[]
  ): void {
    if (websiteSource.crawlSettings.maxPages > 200) {
      errors.push('Maximum pages cannot exceed 200');
    }

    if (websiteSource.crawlSettings.maxDepth > 5) {
      errors.push('Maximum crawl depth cannot exceed 5');
    }
  }

  /**
   * Add performance warnings for resource-intensive operations
   * 
   * AI INSTRUCTIONS:
   * - Warn about potentially slow operations
   * - Guide users toward optimal configurations
   * - Focus on user experience and performance
   */
  private addPerformanceWarnings(websiteSource: WebsiteSource, warnings: string[]): void {
    if (websiteSource.crawlSettings.maxPages > 50) {
      warnings.push('Crawling more than 50 pages may take significant time');
    }

    if (websiteSource.crawlSettings.maxDepth > 3) {
      warnings.push('Deep crawling may include less relevant content');
    }
  }

  /** Check website accessibility for crawling */
  private async checkWebsiteAccessibility(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Website-Crawler-Bot/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      // Consider 2xx and 3xx status codes as accessible
      return response.ok || (response.status >= 300 && response.status < 400);
      
    } catch {
      // If fetch fails (network error, timeout, etc.), consider not accessible
      return false;
    }
  }

  /** Helper method for URL validation */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
} 