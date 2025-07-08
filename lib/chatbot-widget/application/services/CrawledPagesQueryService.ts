/**
 * Crawled Pages Query Service
 * 
 * AI INSTRUCTIONS:
 * - Application layer service for querying crawled pages data
 * - Orchestrates specialized services for filtering, pagination, and statistics
 * - Never exceed 250 lines - single responsibility principle
 * - Follow @golden-rule patterns exactly
 * - Delegate data access to repository interfaces
 * - Handle query errors gracefully with domain-specific error types
 * - Support filtering and pagination for large datasets
 */

import { IVectorKnowledgeRepository } from '../../domain/repositories/IVectorKnowledgeRepository';
import { BusinessRuleViolationError } from '../../domain/errors/ChatbotWidgetDomainErrors';
import { WebsiteValidationService } from './WebsiteValidationService';
import { CrawledPagesFilteringService } from './CrawledPagesFilteringService';
import { CrawledPagesStatisticsService } from './CrawledPagesStatisticsService';
import { CrawledPagesPaginationService } from './CrawledPagesPaginationService';
import { 
  CrawledPagesQueryRequest, 
  CrawledPagesQueryResponse, 
  CrawledPagesStatsRequest, 
  CrawledPagesStatsResponse,
  CrawledPageData
} from '../types/CrawledPagesTypes';

export class CrawledPagesQueryService {
  
  constructor(
    private vectorKnowledgeRepository: IVectorKnowledgeRepository,
    private validationService: WebsiteValidationService
  ) {}

  /**
   * Get crawled pages data for UI display
   * 
   * AI INSTRUCTIONS:
   * - Retrieves crawled pages from vector table
   * - Returns data needed for crawled pages UI display
   * - Handles request validation and error handling
   * - Supports filtering and pagination
   */
  async getCrawledPages(request: CrawledPagesQueryRequest): Promise<CrawledPagesQueryResponse> {
    try {
      // Validate request
      this.validateQueryRequest(request);

      // Get crawled pages from repository
      const crawledPages = await this.vectorKnowledgeRepository.getCrawledPages(
        request.organizationId,
        request.chatbotConfigId,
        request.sourceUrl
      );

      // Apply filtering using specialized service
      const filteredPages = CrawledPagesFilteringService.applyFiltering(
        crawledPages,
        { status: request.status }
      );

      // Apply sorting using specialized service
      const sortedPages = CrawledPagesFilteringService.applySorting(
        filteredPages,
        { sortBy: request.sortBy, sortOrder: request.sortOrder }
      );

      // Apply pagination using specialized service
      const paginatedResult = CrawledPagesPaginationService.applyPagination(
        sortedPages,
        { limit: request.limit, offset: request.offset }
      );

      return {
        success: true,
        crawledPages: paginatedResult.pages,
        totalCount: filteredPages.length,
        hasMore: paginatedResult.hasMore
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

      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve crawled pages',
          context: { 
            organizationId: request.organizationId, 
            chatbotConfigId: request.chatbotConfigId, 
            sourceUrl: request.sourceUrl 
          }
        }
      };
    }
  }

  /** Get crawled pages statistics */
  async getCrawledPagesStats(request: CrawledPagesStatsRequest): Promise<CrawledPagesStatsResponse> {
    try {
      // Validate request
      this.validateStatsRequest(request);

      // Get crawled pages data
      const crawledPages = await this.vectorKnowledgeRepository.getCrawledPages(
        request.organizationId,
        request.chatbotConfigId,
        request.sourceUrl
      );

      // Apply date filtering using specialized service
      const filteredPages = request.dateRange 
        ? CrawledPagesFilteringService.applyFiltering(
            crawledPages,
            { dateRange: request.dateRange }
          )
        : crawledPages;

      // Calculate statistics using specialized service
      const stats = CrawledPagesStatisticsService.calculateStatistics(filteredPages);

      return {
        success: true,
        stats
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

      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve crawled pages statistics',
          context: { 
            organizationId: request.organizationId, 
            chatbotConfigId: request.chatbotConfigId, 
            sourceUrl: request.sourceUrl 
          }
        }
      };
    }
  }

  /** Validate query request parameters */
  private validateQueryRequest(request: CrawledPagesQueryRequest): void {
    if (!request.organizationId?.trim()) {
      throw new BusinessRuleViolationError(
        'Organization ID is required',
        { organizationId: request.organizationId }
      );
    }

    if (!request.chatbotConfigId?.trim()) {
      throw new BusinessRuleViolationError(
        'Chatbot config ID is required',
        { chatbotConfigId: request.chatbotConfigId }
      );
    }

    // Validate pagination options using specialized service
    CrawledPagesPaginationService.validatePaginationOptions({
      limit: request.limit,
      offset: request.offset
    });

    // Validate filtering options using specialized service
    CrawledPagesFilteringService.validateFilteringOptions({
      status: request.status
    });

    // Validate sorting options using specialized service
    CrawledPagesFilteringService.validateSortingOptions({
      sortBy: request.sortBy,
      sortOrder: request.sortOrder
    });
  }

  /** Validate statistics request parameters */
  private validateStatsRequest(request: CrawledPagesStatsRequest): void {
    if (!request.organizationId?.trim()) {
      throw new BusinessRuleViolationError(
        'Organization ID is required',
        { organizationId: request.organizationId }
      );
    }

    if (!request.chatbotConfigId?.trim()) {
      throw new BusinessRuleViolationError(
        'Chatbot config ID is required',
        { chatbotConfigId: request.chatbotConfigId }
      );
    }

    // Validate filtering options using specialized service
    if (request.dateRange) {
      CrawledPagesFilteringService.validateFilteringOptions({
        dateRange: request.dateRange
      });
    }
  }
}

// Re-export types for backward compatibility
export type { 
  CrawledPagesQueryRequest, 
  CrawledPagesQueryResponse, 
  CrawledPagesStatsRequest, 
  CrawledPagesStatsResponse,
  CrawledPageData
} from '../types/CrawledPagesTypes'; 