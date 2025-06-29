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
import { KnowledgeVector } from '../../domain/entities/KnowledgeVector';
import { WebsiteCrawlerService } from '../../infrastructure/providers/knowledge-services/WebsiteCrawlerService';
import { BusinessRuleViolationError } from '../../domain/errors/ContextManagementErrors';
import { VectorManagementService } from './VectorManagementService';

export interface WebsiteCrawlRequest {
  organizationId: string;
  chatbotConfigId: string;
  websiteSource: WebsiteSource;
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
    private websiteCrawlerService: WebsiteCrawlerService,
    private vectorManagementService: VectorManagementService
  ) {}

  /**
   * Crawl single website source and convert to knowledge items
   * 
   * AI INSTRUCTIONS:
   * - Orchestrate single website crawling process
   * - Delegate crawling to infrastructure service
   * - Convert infrastructure results to domain knowledge items
   * - Handle errors gracefully with proper error types
   * - Maintain transaction boundaries
   */
  async crawlWebsiteSource(request: WebsiteCrawlRequest): Promise<WebsiteCrawlResponse> {
    try {
      this.validateCrawlRequest(request);

      // Delegate crawling to infrastructure service with default settings
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

      const crawlResult = await this.websiteCrawlerService.crawlWebsite(
        request.websiteSource,
        crawlSettings
      );
      
      const knowledgeItems = crawlResult.knowledgeItems;

      // Clean up vectors for pages that no longer exist
      await this.cleanupDeletedPageVectors(
        request.organizationId,
        request.chatbotConfigId,
        request.websiteSource,
        knowledgeItems
      );

      // Immediately vectorize the crawled content
      await this.vectorManagementService.ensureVectorsUpToDate(
        request.organizationId,
        request.chatbotConfigId,
        knowledgeItems
      );

      return {
        success: true,
        knowledgeItems,
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
            websiteSource
          });

          if (crawlResponse.success && crawlResponse.knowledgeItems) {
            results.successfulSources++;
            results.totalKnowledgeItems += crawlResponse.knowledgeItems.length;

            // Knowledge items are already vectorized in crawlWebsiteSource()
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

      // TODO: Add connectivity check
      // if (websiteSource.url && this.isValidUrl(websiteSource.url)) {
      //   const isAccessible = await this.checkWebsiteAccessibility(websiteSource.url);
      //   if (!isAccessible) {
      //     errors.push('Website is not accessible or blocks crawlers');
      //   }
      // }

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

    if (!request.websiteSource.isActive) {
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
   * Clean up vectors for pages that no longer exist on the website
   * 
   * AI INSTRUCTIONS:
   * - Compare current crawl results with existing vectors
   * - Remove vectors for pages that are no longer found
   * - Maintain data consistency in vector cache
   * - Log cleanup operations for monitoring
   */
  private async cleanupDeletedPageVectors(
    organizationId: string,
    chatbotConfigId: string,
    websiteSource: WebsiteSource,
    currentKnowledgeItems: KnowledgeItem[]
  ): Promise<void> {
    try {
      // Get all existing vectors for this website source
      const allVectors = await this.vectorManagementService.getAllVectors(
        organizationId,
        chatbotConfigId
      );

      // Filter to only vectors from this website source
      const websiteVectors = allVectors.filter((vector: KnowledgeVector) => 
        vector.knowledgeItemId.startsWith(`${websiteSource.id}-page-`)
      );

      // Get current knowledge item IDs
      const currentItemIds = new Set(currentKnowledgeItems.map(item => item.id));

      // Find vectors for deleted pages
      const deletedVectors = websiteVectors.filter((vector: KnowledgeVector) => 
        !currentItemIds.has(vector.knowledgeItemId)
      );

      // Delete vectors for pages that no longer exist
      for (const vector of deletedVectors) {
        await this.vectorManagementService.deleteVector(
          organizationId,
          chatbotConfigId,
          vector.knowledgeItemId
        );
      }

      if (deletedVectors.length > 0) {
        console.log(`🗑️ Cleaned up ${deletedVectors.length} vectors for deleted pages from ${websiteSource.name}`);
      }

    } catch (error) {
      // Log error but don't fail the entire crawl process
      console.error('Error cleaning up deleted page vectors:', error);
    }
  }
} 