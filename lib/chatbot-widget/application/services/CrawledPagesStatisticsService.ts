import { BusinessRuleViolationError } from '../../domain/errors/ChatbotWidgetDomainErrors';
import { CrawledPageData, CrawledPagesStatistics } from '../types/CrawledPagesTypes';

/**
 * Crawled Pages Statistics Service
 * 
 * AI INSTRUCTIONS:
 * - Handle all statistics calculation logic for crawled pages
 * - Maintain single responsibility for data analysis operations
 * - Use domain-specific error types for validation failures
 * - Keep calculation logic pure and testable
 * - Handle edge cases like empty datasets gracefully
 * - Provide comprehensive metrics for monitoring and optimization
 */
export class CrawledPagesStatisticsService {

  /**
   * Calculate comprehensive statistics from crawled pages
   * 
   * AI INSTRUCTIONS:
   * - Calculate all relevant metrics for crawled pages
   * - Handle edge cases like empty datasets
   * - Provide meaningful metrics for monitoring
   * - Maintain type safety throughout calculations
   */
  static calculateStatistics(pages: CrawledPageData[]): CrawledPagesStatistics {
    if (!Array.isArray(pages)) {
      throw new BusinessRuleViolationError(
        'Pages must be an array',
        { pagesType: typeof pages }
      );
    }

    const totalPages = pages.length;
    
    // Handle empty dataset
    if (totalPages === 0) {
      return this.getEmptyStatistics();
    }

    // Calculate status-based metrics
    const statusCounts = this.calculateStatusCounts(pages);
    const successRate = statusCounts.successfulPages / totalPages;

    // Calculate performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(pages);

    // Calculate content metrics
    const contentMetrics = this.calculateContentMetrics(pages);

    // Calculate temporal metrics
    const temporalMetrics = this.calculateTemporalMetrics(pages);

    return {
      totalPages,
      successfulPages: statusCounts.successfulPages,
      failedPages: statusCounts.failedPages,
      skippedPages: statusCounts.skippedPages,
      successRate,
      averageResponseTime: performanceMetrics.averageResponseTime,
      lastCrawlDate: temporalMetrics.lastCrawlDate,
      uniqueSourcesCount: contentMetrics.uniqueSourcesCount,
      averageDepth: contentMetrics.averageDepth
    };
  }

  /**
   * Calculate status-based counts
   * 
   * AI INSTRUCTIONS:
   * - Count pages by status type
   * - Handle all possible status values
   * - Maintain accuracy in counting
   */
  private static calculateStatusCounts(pages: CrawledPageData[]) {
    const successfulPages = pages.filter(p => p.status === 'success').length;
    const failedPages = pages.filter(p => p.status === 'failed').length;
    const skippedPages = pages.filter(p => p.status === 'skipped').length;

    return {
      successfulPages,
      failedPages,
      skippedPages
    };
  }

  /**
   * Calculate performance-related metrics
   * 
   * AI INSTRUCTIONS:
   * - Calculate response time statistics
   * - Handle missing response time data
   * - Provide meaningful performance insights
   */
  private static calculatePerformanceMetrics(pages: CrawledPageData[]) {
    const responseTimes = pages
      .filter(p => p.responseTime !== undefined && p.responseTime !== null)
      .map(p => p.responseTime!);

    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    return {
      averageResponseTime
    };
  }

  /**
   * Calculate content-related metrics
   * 
   * AI INSTRUCTIONS:
   * - Calculate unique sources and depth statistics
   * - Handle URL parsing safely
   * - Provide content distribution insights
   */
  private static calculateContentMetrics(pages: CrawledPageData[]) {
    // Calculate unique sources
    const uniqueSources = new Set();
    pages.forEach(page => {
      try {
        const url = new URL(page.url);
        uniqueSources.add(url.origin);
      } catch (error) {
        // Skip invalid URLs
      }
    });

    // Calculate average depth
    const averageDepth = pages.length > 0 
      ? pages.reduce((sum, page) => sum + page.depth, 0) / pages.length 
      : 0;

    return {
      uniqueSourcesCount: uniqueSources.size,
      averageDepth
    };
  }

  /**
   * Calculate temporal metrics
   * 
   * AI INSTRUCTIONS:
   * - Calculate time-based statistics
   * - Handle date comparisons safely
   * - Provide temporal insights
   */
  private static calculateTemporalMetrics(pages: CrawledPageData[]) {
    const lastCrawlDate = pages.length > 0 
      ? new Date(Math.max(...pages.map(p => p.crawledAt.getTime())))
      : new Date();

    return {
      lastCrawlDate
    };
  }

  /**
   * Get empty statistics for zero pages
   * 
   * AI INSTRUCTIONS:
   * - Provide meaningful default values
   * - Handle empty dataset gracefully
   * - Maintain consistent return type
   */
  private static getEmptyStatistics(): CrawledPagesStatistics {
    return {
      totalPages: 0,
      successfulPages: 0,
      failedPages: 0,
      skippedPages: 0,
      successRate: 0,
      averageResponseTime: 0,
      lastCrawlDate: new Date(),
      uniqueSourcesCount: 0,
      averageDepth: 0
    };
  }

  /**
   * Validate pages data for statistics calculation
   * 
   * AI INSTRUCTIONS:
   * - Validate input data structure
   * - Use domain-specific error types
   * - Check for required fields
   */
  static validatePagesData(pages: unknown): asserts pages is CrawledPageData[] {
    if (!Array.isArray(pages)) {
      throw new BusinessRuleViolationError(
        'Pages must be an array',
        { pagesType: typeof pages }
      );
    }

    pages.forEach((page, index) => {
      if (!page || typeof page !== 'object') {
        throw new BusinessRuleViolationError(
          `Page at index ${index} must be an object`,
          { pageIndex: index, pageType: typeof page }
        );
      }

      const pageObj = page as Record<string, unknown>;
      
      if (!pageObj.url || typeof pageObj.url !== 'string') {
        throw new BusinessRuleViolationError(
          `Page at index ${index} must have a valid URL`,
          { pageIndex: index, url: pageObj.url }
        );
      }

      if (!pageObj.status || !['success', 'failed', 'skipped'].includes(pageObj.status as string)) {
        throw new BusinessRuleViolationError(
          `Page at index ${index} must have a valid status`,
          { pageIndex: index, status: pageObj.status }
        );
      }

      if (!pageObj.crawledAt || !(pageObj.crawledAt instanceof Date)) {
        throw new BusinessRuleViolationError(
          `Page at index ${index} must have a valid crawledAt date`,
          { pageIndex: index, crawledAt: pageObj.crawledAt }
        );
      }
    });
  }
} 