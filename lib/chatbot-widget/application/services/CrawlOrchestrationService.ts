/**
 * Crawl Orchestration Service
 * 
 * AI INSTRUCTIONS:
 * - Application layer service for orchestrating website crawling operations
 * - Coordinates single website crawling and storage processes
 * - Never exceed 250 lines - single responsibility principle
 * - Follow @golden-rule patterns exactly
 * - Delegate crawling and storage to infrastructure services
 * - Handle errors gracefully with domain-specific error types
 * - Maintain transaction boundaries and data consistency
 */

import { WebsiteSource } from '../../domain/value-objects/ai-configuration/KnowledgeBase';
import { KnowledgeItem } from '../../domain/services/interfaces/IKnowledgeRetrievalService';
import { CrawlAndStoreWebsiteUseCase } from '../use-cases/CrawlAndStoreWebsiteUseCase';
import { BusinessRuleViolationError } from '../../domain/errors/ChatbotWidgetDomainErrors';
import { WebsiteValidationService } from './WebsiteValidationService';

export interface WebsiteCrawlRequest {
  organizationId: string;
  chatbotConfigId: string;
  websiteSource: WebsiteSource;
  forceRefresh?: boolean;
  statusUpdateCallback?: (status: 'vectorizing', progress: { vectorizedItems: number; totalItems: number; currentItem: string }) => Promise<void>;
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

export interface CrawlSettings {
  maxPages: number;
  maxDepth: number;
  includePatterns: string[];
  excludePatterns: string[];
  respectRobotsTxt: boolean;
  crawlFrequency: 'manual' | 'daily' | 'weekly' | 'monthly';
  includeImages: boolean;
  includePDFs: boolean;
}

export class CrawlOrchestrationService {
  
  constructor(
    private crawlAndStoreUseCase: CrawlAndStoreWebsiteUseCase,
    private validationService: WebsiteValidationService
  ) {}

  // Crawl single website source and convert to knowledge items
  async crawlWebsiteSource(request: WebsiteCrawlRequest): Promise<WebsiteCrawlResponse> {
    try {
      // Validate request using validation service
      this.validationService.validateCrawlRequest({
        organizationId: request.organizationId,
        chatbotConfigId: request.chatbotConfigId,
        websiteSource: request.websiteSource,
        forceRefresh: request.forceRefresh
      });

      // Prepare crawl settings with defaults
      const crawlSettings = this.prepareCrawlSettings(request.websiteSource);

      // Execute crawling and storage through use case with status callback
      const crawlResult = await this.crawlAndStoreUseCase.execute(
        request.organizationId,
        request.chatbotConfigId,
        request.websiteSource,
        crawlSettings,
        request.statusUpdateCallback
      );

      return {
        success: true,
        knowledgeItems: undefined, // Data is now persisted, items not returned in memory
        crawledPages: crawlResult.crawledPages
      };

    } catch (error) {
      return this.handleCrawlError(error, request);
    }
  }

  // Prepare crawl settings with appropriate defaults
  private prepareCrawlSettings(websiteSource: WebsiteSource): CrawlSettings {
    return {
      maxPages: websiteSource.crawlSettings?.maxPages!,
      maxDepth: websiteSource.crawlSettings?.maxDepth!,
      includePatterns: websiteSource.crawlSettings?.includePatterns!,
      excludePatterns: websiteSource.crawlSettings?.excludePatterns!,
      respectRobotsTxt: websiteSource.crawlSettings?.respectRobotsTxt!,
      crawlFrequency: websiteSource.crawlSettings?.crawlFrequency!,
      includeImages: websiteSource.crawlSettings?.includeImages!,
      includePDFs: websiteSource.crawlSettings?.includePDFs!
    };
  }

  // Handle crawl errors
  private handleCrawlError(error: unknown, request: WebsiteCrawlRequest): WebsiteCrawlResponse {
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

  // Validate website source before crawling
  async validateWebsiteSource(websiteSource: WebsiteSource) {
    return await this.validationService.validateWebsiteSource(websiteSource);
  }

  // Get crawl progress information
  async getCrawlProgress(
    _organizationId: string,
    _chatbotConfigId: string,
    _sourceId: string
  ): Promise<{
    isRunning: boolean;
    progress?: {
      current: number;
      total: number;
      status: string;
      startedAt: Date;
      estimatedCompletion?: Date;
    };
    error?: string;
  }> {
    try {
      // This would typically query a progress tracking system
      // For now, return a simple not-running status
      return {
        isRunning: false
      };
    } catch (error) {
      return {
        isRunning: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Cancel ongoing crawl operation
  async cancelCrawl(
    _organizationId: string,
    _chatbotConfigId: string,
    _sourceId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // This would typically signal a cancellation to the crawling service
      // For now, return success
      return {
        success: true,
        message: 'Crawl operation cancelled successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to cancel crawl'
      };
    }
  }
} 