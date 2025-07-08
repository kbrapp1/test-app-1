/**
 * Batch Processing Service
 * 
 * AI INSTRUCTIONS:
 * - Application layer service for batch processing multiple website sources
 * - Coordinates parallel processing with error isolation
 * - Never exceed 250 lines - single responsibility principle
 * - Follow @golden-rule patterns exactly
 * - Handle partial failures gracefully
 * - Aggregate results across all sources
 * - Maintain data consistency across operations
 */

import { WebsiteSource } from '../../domain/value-objects/ai-configuration/KnowledgeBase';
import { BusinessRuleViolationError } from '../../domain/errors/ChatbotWidgetDomainErrors';
import { CrawlOrchestrationService, WebsiteCrawlRequest } from './CrawlOrchestrationService';
import { WebsiteValidationService } from './WebsiteValidationService';

export interface WebsiteKnowledgeUpdateRequest {
  organizationId: string;
  chatbotConfigId: string;
  websiteSources: WebsiteSource[];
  forceRefresh?: boolean;
  maxConcurrency?: number;
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
  processingTime: number;
  skippedSources: number;
}

export interface BatchProcessingResult {
  sourceId: string;
  success: boolean;
  knowledgeItemCount: number;
  error?: string;
  processingTime: number;
  skipped: boolean;
}

export class BatchProcessingService {
  
  constructor(
    private crawlOrchestrationService: CrawlOrchestrationService,
    private validationService: WebsiteValidationService
  ) {}

  /** Update knowledge base with multiple website sources */
  async updateWebsiteKnowledge(request: WebsiteKnowledgeUpdateRequest): Promise<WebsiteKnowledgeUpdateResponse> {
    const startTime = Date.now();
    
    try {
      // Validate batch request
      this.validationService.validateUpdateRequest({
        organizationId: request.organizationId,
        chatbotConfigId: request.chatbotConfigId,
        websiteSources: request.websiteSources,
        forceRefresh: request.forceRefresh
      });

      // Initialize response
      const response: WebsiteKnowledgeUpdateResponse = {
        success: true,
        totalSources: request.websiteSources.length,
        successfulSources: 0,
        failedSources: 0,
        totalKnowledgeItems: 0,
        errors: [],
        processingTime: 0,
        skippedSources: 0
      };

      // Process sources with controlled concurrency
      const maxConcurrency = request.maxConcurrency || 3;
      const results = await this.processSourcesBatch(request, maxConcurrency);

      // Aggregate results
      this.aggregateResults(results, response);

      // Calculate processing time
      response.processingTime = Date.now() - startTime;

      // Determine overall success
      response.success = response.failedSources === 0;

      return response;

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

  /** Process website sources in controlled batches */
  private async processSourcesBatch(
    request: WebsiteKnowledgeUpdateRequest,
    maxConcurrency: number
  ): Promise<BatchProcessingResult[]> {
    const results: BatchProcessingResult[] = [];
    const semaphore = new Semaphore(maxConcurrency);

    // Create processing promises for all sources
    const processingPromises = request.websiteSources.map(async (websiteSource) => {
      return semaphore.acquire(async () => {
        return await this.processSingleSource(request, websiteSource);
      });
    });

    // Wait for all processing to complete
    const batchResults = await Promise.all(processingPromises);
    results.push(...batchResults);

    return results;
  }

  /** Process a single website source */
  private async processSingleSource(
    request: WebsiteKnowledgeUpdateRequest,
    websiteSource: WebsiteSource
  ): Promise<BatchProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Skip inactive sources unless force refresh
      if (!websiteSource.isActive && !request.forceRefresh) {
        return {
          sourceId: websiteSource.id,
          success: true,
          knowledgeItemCount: 0,
          processingTime: Date.now() - startTime,
          skipped: true
        };
      }

      // Process the source
      const crawlRequest: WebsiteCrawlRequest = {
        organizationId: request.organizationId,
        chatbotConfigId: request.chatbotConfigId,
        websiteSource,
        forceRefresh: request.forceRefresh
      };

      const crawlResponse = await this.crawlOrchestrationService.crawlWebsiteSource(crawlRequest);

      if (crawlResponse.success) {
        // Count successful crawled pages as proxy for knowledge items
        const knowledgeItemCount = crawlResponse.crawledPages?.filter(
          page => page.status === 'success'
        ).length || 0;

        return {
          sourceId: websiteSource.id,
          success: true,
          knowledgeItemCount,
          processingTime: Date.now() - startTime,
          skipped: false
        };
      } else {
        return {
          sourceId: websiteSource.id,
          success: false,
          knowledgeItemCount: 0,
          error: crawlResponse.error?.message || 'Unknown crawl error',
          processingTime: Date.now() - startTime,
          skipped: false
        };
      }

    } catch (error) {
      return {
        sourceId: websiteSource.id,
        success: false,
        knowledgeItemCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
        skipped: false
      };
    }
  }

  /** Aggregate individual processing results */
  private aggregateResults(
    results: BatchProcessingResult[],
    response: WebsiteKnowledgeUpdateResponse
  ): void {
    for (const result of results) {
      if (result.skipped) {
        response.skippedSources++;
      } else if (result.success) {
        response.successfulSources++;
        response.totalKnowledgeItems += result.knowledgeItemCount;
      } else {
        response.failedSources++;
        response.errors.push({
          sourceId: result.sourceId,
          error: result.error || 'Unknown error'
        });
      }
    }
  }

  /** Get batch processing statistics */
  getBatchProcessingStats(): {
    averageProcessingTime: number;
    successRate: number;
    recommendedConcurrency: number;
  } {
    // This would typically be calculated from historical data
    // For now, return sensible defaults
    return {
      averageProcessingTime: 30000, // 30 seconds average
      successRate: 0.85, // 85% success rate
      recommendedConcurrency: 3 // Recommended concurrent sources
    };
  }
}

/** Simple semaphore implementation for controlling concurrency */
class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const tryAcquire = () => {
        if (this.permits > 0) {
          this.permits--;
          fn()
            .then(resolve)
            .catch(reject)
            .finally(() => {
              this.permits++;
              if (this.waitQueue.length > 0) {
                const next = this.waitQueue.shift();
                next?.();
              }
            });
        } else {
          this.waitQueue.push(tryAcquire);
        }
      };

      tryAcquire();
    });
  }
} 