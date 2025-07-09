/**
 * Website Knowledge Application Service
 * 
 * AI INSTRUCTIONS:
 * - Application layer service for orchestrating website knowledge management
 * - Coordinates specialized services following DDD patterns
 * - Never exceed 250 lines - delegates to focused services
 * - Follow @golden-rule patterns exactly
 * - Delegate all business logic to specialized services
 * - Handle cross-aggregate coordination through events
 * - Use domain-specific error types, no generic errors
 * - Maintain clean separation between application and domain layers
 */

import { WebsiteSource } from '../../domain/value-objects/ai-configuration/KnowledgeBase';
import { CrawlOrchestrationService, WebsiteCrawlRequest, WebsiteCrawlResponse } from './CrawlOrchestrationService';
import { BatchProcessingService, WebsiteKnowledgeUpdateRequest, WebsiteKnowledgeUpdateResponse } from './BatchProcessingService';
import { CrawledPagesQueryService } from './CrawledPagesQueryService';
import { CrawledPagesQueryRequest, CrawledPagesQueryResponse } from '../types/CrawledPagesTypes';
import { WebsiteValidationService, WebsiteValidationResult } from './WebsiteValidationService';

export class WebsiteKnowledgeApplicationService {
  
  constructor(
    private crawlOrchestrationService: CrawlOrchestrationService,
    private batchProcessingService: BatchProcessingService,
    private crawledPagesQueryService: CrawledPagesQueryService,
    private validationService: WebsiteValidationService
  ) {}

  /** Crawl single website source and convert to knowledge items */
  async crawlWebsiteSource(request: WebsiteCrawlRequest): Promise<WebsiteCrawlResponse> {
    return await this.crawlOrchestrationService.crawlWebsiteSource(request);
  }

  /**
   * Update knowledge base with multiple website sources
   * 
   * AI INSTRUCTIONS:
   * - Delegate to BatchProcessingService for batch website processing
   * - Maintain backward compatibility with existing interface
   * - Handle errors gracefully with proper error types
   * - Follow orchestration patterns from @golden-rule
   */
  async updateWebsiteKnowledge(request: WebsiteKnowledgeUpdateRequest): Promise<WebsiteKnowledgeUpdateResponse> {
    return await this.batchProcessingService.updateWebsiteKnowledge(request);
  }

  /**
   * Validate website source for crawling readiness
   * 
   * AI INSTRUCTIONS:
   * - Delegate to WebsiteValidationService for validation logic
   * - Maintain backward compatibility with existing interface
   * - Handle errors gracefully with proper error types
   * - Follow orchestration patterns from @golden-rule
   */
  async validateWebsiteSource(websiteSource: WebsiteSource): Promise<WebsiteValidationResult> {
    return await this.validationService.validateWebsiteSource(websiteSource);
  }

  /**
   * Get crawled pages data for UI display
   * 
   * AI INSTRUCTIONS:
   * - Delegate to CrawledPagesQueryService for querying crawled pages
   * - Maintain backward compatibility with existing interface
   * - Handle errors gracefully with proper error types
   * - Follow orchestration patterns from @golden-rule
   */
  async getCrawledPages(
    organizationId: string,
    chatbotConfigId: string,
    sourceUrl?: string
  ): Promise<CrawledPagesQueryResponse> {
    const request: CrawledPagesQueryRequest = {
      organizationId,
      chatbotConfigId,
      sourceUrl
    };

    return await this.crawledPagesQueryService.getCrawledPages(request);
  }

  /**
   * Get crawled pages statistics
   * 
   * AI INSTRUCTIONS:
   * - Delegate to CrawledPagesQueryService for statistics
   * - Provide comprehensive metrics for monitoring
   * - Handle errors gracefully with proper error types
   * - Follow orchestration patterns from @golden-rule
   */
  async getCrawledPagesStats(
    organizationId: string,
    chatbotConfigId: string,
    sourceUrl?: string,
    dateRange?: { startDate: Date; endDate: Date }
  ) {
    return await this.crawledPagesQueryService.getCrawledPagesStats({
      organizationId,
      chatbotConfigId,
      sourceUrl,
      dateRange
    });
  }

  /** Get batch processing statistics */
  getBatchProcessingStats() {
    return this.batchProcessingService.getBatchProcessingStats();
  }
} 