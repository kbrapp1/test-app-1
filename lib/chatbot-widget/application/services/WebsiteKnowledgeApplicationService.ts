/**
 * Website Knowledge Application Service
 * 
 * AI INSTRUCTIONS:
 * - Application layer service for orchestrating website knowledge management
 * - Coordinates between infrastructure services and domain services
 * - Never exceed 250 lines - refactor into smaller services if needed
 * - Follow @golden-rule patterns exactly
 * - Delegate all business logic to domain services
 * - Handle cross-aggregate coordination through events
 * - Use domain-specific error types, no generic errors
 * - Maintain clean separation between application and domain layers
 */

import { WebsiteSource } from '../../domain/value-objects/ai-configuration/KnowledgeBase';
import { KnowledgeItem } from '../../domain/services/interfaces/IKnowledgeRetrievalService';
import { IVectorKnowledgeRepository } from '../../domain/repositories/IVectorKnowledgeRepository';
// KnowledgeVector entity removed - using vector repository interface directly
import { CrawlAndStoreWebsiteUseCase } from '../use-cases/CrawlAndStoreWebsiteUseCase';
import { BusinessRuleViolationError } from '../../domain/errors/ContextManagementErrors';

export interface WebsiteCrawlRequest {
  organizationId: string;
  chatbotConfigId: string;
  websiteSource: WebsiteSource;
  forceRefresh?: boolean;
  progressCallback?: (progress: { current: number; total: number; status: string }) => void;
}

export interface WebsiteCrawlResponse {
  success: boolean;
  knowledgeItems?: KnowledgeItem[];
  crawledPages?: Array<{
    url: string;
    title: string;
    content: string;
    depth: number;
    crawledAt: Date;
    status: 'success' | 'failed' | 'skipped';
    errorMessage?: string;
    responseTime?: number;
    statusCode?: number;
  }>;
  error?: {
    code: string;
    message: string;
    context?: Record<string, any>;
  };
}

export interface WebsiteKnowledgeUpdateRequest {
  organizationId: string;
  chatbotConfigId: string;
  websiteSources: WebsiteSource[];
  forceRefresh?: boolean;
}

export interface WebsiteKnowledgeUpdateResponse {
  success: boolean;
  totalSources: number;
  successfulSources: number;
  failedSources: number;
  totalKnowledgeItems: number;
  errors: Array<{
    sourceId: string;
    error: string;
  }>;
}

export class WebsiteKnowledgeApplicationService {
  
  constructor(
    private crawlAndStoreUseCase: CrawlAndStoreWebsiteUseCase,
    private vectorKnowledgeRepository: IVectorKnowledgeRepository
  ) {}

  /**
   * Crawl single website source and convert to knowledge items
   * 
   * AI INSTRUCTIONS:
   * - Orchestrate single website crawling process
   * - Delegate crawling AND storage to infrastructure service
   * - Ensure knowledge items are persisted with embeddings
   * - Handle errors gracefully with proper error types
   * - Maintain transaction boundaries
   */
  async crawlWebsiteSource(request: WebsiteCrawlRequest): Promise<WebsiteCrawlResponse> {
    try {
      this.validateCrawlRequest(request);

      // Delegate crawling and storage to infrastructure service with default settings
      const crawlSettings = {
        maxPages: request.websiteSource.crawlSettings?.maxPages || 50,
        maxDepth: request.websiteSource.crawlSettings?.maxDepth || 3,
        includePatterns: request.websiteSource.crawlSettings?.includePatterns || [],
        excludePatterns: request.websiteSource.crawlSettings?.excludePatterns || ['/admin/*', '/login', '/logout'],
        respectRobotsTxt: request.websiteSource.crawlSettings?.respectRobotsTxt ?? true,
        crawlFrequency: request.websiteSource.crawlSettings?.crawlFrequency || 'manual' as const,
        includeImages: request.websiteSource.crawlSettings?.includeImages ?? false,
        includePDFs: request.websiteSource.crawlSettings?.includePDFs ?? true
      };

      // Use crawlAndStoreWebsite which handles both crawling AND persistence
      const crawlResult = await this.crawlAndStoreUseCase.execute(
        request.organizationId,
        request.chatbotConfigId,
        request.websiteSource,
        crawlSettings
      );

      return {
        success: true,
        knowledgeItems: undefined, // Data is now persisted, items not returned in memory
        crawledPages: crawlResult.crawledPages
      };

    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            context: error.context
          }
        };
      }

      // Wrap unexpected errors
      return {
        success: false,
        error: {
          code: 'WEBSITE_CRAWL_ERROR',
          message: `Website crawl failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          context: { 
            sourceId: request.websiteSource.id,
            url: request.websiteSource.url 
          }
        }
      };
    }
  }

  /**
   * Update knowledge base with multiple website sources
   * 
   * AI INSTRUCTIONS:
   * - Orchestrate batch website crawling and knowledge updates
   * - Process sources in parallel with proper error isolation
   * - Aggregate results across all sources
   * - Handle partial failures gracefully
   * - Maintain data consistency across operations
   */
  async updateWebsiteKnowledge(request: WebsiteKnowledgeUpdateRequest): Promise<WebsiteKnowledgeUpdateResponse> {
    try {
      this.validateUpdateRequest(request);

      const results: WebsiteKnowledgeUpdateResponse = {
        success: true,
        totalSources: request.websiteSources.length,
        successfulSources: 0,
        failedSources: 0,
        totalKnowledgeItems: 0,
        errors: []
      };

      // Process each website source
      for (const websiteSource of request.websiteSources) {
        try {
          // Skip inactive sources unless force refresh
          if (!websiteSource.isActive && !request.forceRefresh) {
            continue;
          }

          const crawlResponse = await this.crawlWebsiteSource({
            organizationId: request.organizationId,
            chatbotConfigId: request.chatbotConfigId,
            websiteSource,
            forceRefresh: request.forceRefresh
          });

          if (crawlResponse.success) {
            results.successfulSources++;
            // knowledgeItems is undefined since data is persisted directly
            // Use crawled pages count as proxy for stored items
            results.totalKnowledgeItems += crawlResponse.crawledPages?.filter(page => page.status === 'success').length || 0;

            // Knowledge items are already stored and vectorized in crawlAndStoreWebsite()
            // No additional processing needed here

          } else {
            results.failedSources++;
            results.errors.push({
              sourceId: websiteSource.id,
              error: crawlResponse.error?.message || 'Unknown crawl error'
            });
          }

        } catch (error) {
          results.failedSources++;
          results.errors.push({
            sourceId: websiteSource.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Determine overall success
      results.success = results.failedSources === 0;

      return results;

    } catch (error) {
      throw new BusinessRuleViolationError(
        `Website knowledge update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { 
          organizationId: request.organizationId,
          chatbotConfigId: request.chatbotConfigId,
          sourceCount: request.websiteSources.length
        }
      );
    }
  }

  /**
   * Validate website source for crawling readiness
   * 
   * AI INSTRUCTIONS:
   * - Check website source configuration and accessibility
   * - Validate crawl settings against business rules
   * - Return validation results for UI feedback
   * - Use domain-specific error types
   */
  async validateWebsiteSource(websiteSource: WebsiteSource): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Basic validation
      if (!websiteSource.url || !this.isValidUrl(websiteSource.url)) {
        errors.push('Invalid or missing website URL');
      }

      if (!websiteSource.name?.trim()) {
        errors.push('Website source name is required');
      }

      // Crawl settings validation
      if (websiteSource.crawlSettings.maxPages > 200) {
        errors.push('Maximum pages cannot exceed 200');
      }

      if (websiteSource.crawlSettings.maxDepth > 5) {
        errors.push('Maximum crawl depth cannot exceed 5');
      }

      // Performance warnings
      if (websiteSource.crawlSettings.maxPages > 50) {
        warnings.push('Crawling more than 50 pages may take significant time');
      }

      if (websiteSource.crawlSettings.maxDepth > 3) {
        warnings.push('Deep crawling may include less relevant content');
      }

      // Connectivity check
      if (websiteSource.url && this.isValidUrl(websiteSource.url)) {
        try {
          const isAccessible = await this.checkWebsiteAccessibility(websiteSource.url);
          if (!isAccessible) {
            errors.push('Website is not accessible or blocks crawlers');
          }
        } catch (error) {
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

  /**
   * Validate crawl request against business rules
   * 
   * AI INSTRUCTIONS:
   * - Enforce application-level business rules
   * - Use domain-specific error types
   * - Validate organization and chatbot access
   * - Check website source configuration
   */
  private validateCrawlRequest(request: WebsiteCrawlRequest): void {
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
  private validateUpdateRequest(request: WebsiteKnowledgeUpdateRequest): void {
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

  /**
   * Check website accessibility for crawling
   * 
   * AI INSTRUCTIONS:
   * - Quick HEAD request to check if website is accessible
   * - Return boolean for accessibility status
   * - Handle timeouts and errors gracefully
   * - Follow @golden-rule patterns for error handling
   */
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
      
    } catch (error) {
      // If fetch fails (network error, timeout, etc.), consider not accessible
      return false;
    }
  }

  /**
   * Helper method for URL validation
   * 
   * AI INSTRUCTIONS:
   * - Simple URL format validation
   * - No external dependencies
   * - Handle edge cases gracefully
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get crawled pages data for UI display
   * 
   * AI INSTRUCTIONS:
   * - Retrieves crawled pages from vector table
   * - Returns data needed for crawled pages UI display
   * - Handles request validation and error handling
   */
  async getCrawledPages(
    organizationId: string,
    chatbotConfigId: string,
    sourceUrl?: string
  ): Promise<{
    success: boolean;
    crawledPages?: Array<{
      url: string;
      title: string;
      content: string;
      status: 'success' | 'failed' | 'skipped';
      statusCode?: number;
      responseTime?: number;
      depth: number;
      crawledAt: Date;
      errorMessage?: string;
    }>;
    error?: {
      code: string;
      message: string;
      context?: Record<string, any>;
    };
  }> {
    try {
      // Validate request
      if (!organizationId?.trim()) {
        throw new BusinessRuleViolationError(
          'Organization ID is required',
          { organizationId }
        );
      }

      if (!chatbotConfigId?.trim()) {
        throw new BusinessRuleViolationError(
          'Chatbot config ID is required',
          { chatbotConfigId }
        );
      }

      // Get crawled pages from vector table
      const crawledPages = await this.vectorKnowledgeRepository.getCrawledPages(
        organizationId,
        chatbotConfigId,
        sourceUrl
      );

      return {
        success: true,
        crawledPages
      };

    } catch (error) {
      console.error('❌ WebsiteKnowledgeApplicationService: Get crawled pages failed:', error);
      
      if (error instanceof BusinessRuleViolationError) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            context: error.context
          }
        };
      }

      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve crawled pages',
          context: { organizationId, chatbotConfigId, sourceUrl }
        }
      };
    }
  }
} 