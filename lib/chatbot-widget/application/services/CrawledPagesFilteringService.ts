import { BusinessRuleViolationError } from '../../domain/errors/ChatbotWidgetDomainErrors';
import { 
  CrawledPageData, 
  FilteringOptions, 
  SortingOptions, 
  CrawledPageSortField, 
  SortOrder 
} from '../types/CrawledPagesTypes';

/**
 * Crawled Pages Filtering Service
 * 
 * AI INSTRUCTIONS:
 * - Handle all filtering and sorting logic for crawled pages
 * - Maintain single responsibility for data filtering operations
 * - Use domain-specific error types for validation failures
 * - Keep filtering logic pure and testable
 * - Support multiple filtering criteria and sorting options
 * - Handle edge cases gracefully
 */
export class CrawledPagesFilteringService {

  /**
   * Apply filtering to crawled pages
   * 
   * AI INSTRUCTIONS:
   * - Filter pages based on status and date range
   * - Handle undefined values gracefully
   * - Maintain type safety throughout filtering
   * - Support multiple filter criteria simultaneously
   */
  static applyFiltering(
    pages: CrawledPageData[],
    options: FilteringOptions
  ): CrawledPageData[] {
    let filtered = pages;

    // Filter by status if specified
    if (options.status) {
      filtered = filtered.filter(page => page.status === options.status);
    }

    // Filter by date range if specified
    if (options.dateRange) {
      filtered = this.applyDateFiltering(filtered, options.dateRange);
    }

    return filtered;
  }

  /**
   * Apply sorting to crawled pages
   * 
   * AI INSTRUCTIONS:
   * - Sort pages based on specified criteria
   * - Handle different sort fields and orders
   * - Maintain stable sorting for consistent results
   * - Default to descending order for dates
   */
  static applySorting(
    pages: CrawledPageData[],
    options: SortingOptions
  ): CrawledPageData[] {
    if (!options.sortBy) {
      return pages;
    }

    const sortOrder = options.sortOrder || 'desc';
    const multiplier = sortOrder === 'asc' ? 1 : -1;

    return pages.sort((a, b) => {
      const comparison = this.comparePages(a, b, options.sortBy!);
      return comparison * multiplier;
    });
  }

  /**
   * Apply date filtering to crawled pages
   * 
   * AI INSTRUCTIONS:
   * - Filter pages by crawl date range
   * - Handle undefined date range gracefully
   * - Validate date range before filtering
   * - Maintain type safety
   */
  private static applyDateFiltering(
    pages: CrawledPageData[],
    dateRange: { startDate: Date; endDate: Date }
  ): CrawledPageData[] {
    // Validate date range
    if (dateRange.startDate >= dateRange.endDate) {
      throw new BusinessRuleViolationError(
        'Start date must be before end date',
        { dateRange }
      );
    }

    return pages.filter(page => 
      page.crawledAt >= dateRange.startDate && 
      page.crawledAt <= dateRange.endDate
    );
  }

  /**
   * Compare two pages for sorting
   * 
   * AI INSTRUCTIONS:
   * - Handle different sort fields appropriately
   * - Provide consistent comparison logic
   * - Handle null/undefined values safely
   * - Return standard comparison result (-1, 0, 1)
   */
  private static comparePages(
    a: CrawledPageData,
    b: CrawledPageData,
    sortBy: CrawledPageSortField
  ): number {
    switch (sortBy) {
      case 'crawledAt':
        return a.crawledAt.getTime() - b.crawledAt.getTime();
      
      case 'url':
        return a.url.localeCompare(b.url);
      
      case 'status':
        return a.status.localeCompare(b.status);
      
      default:
        return 0;
    }
  }

  /**
   * Validate filtering options
   * 
   * AI INSTRUCTIONS:
   * - Validate filtering parameters
   * - Use domain-specific error types
   * - Check for valid status values
   * - Validate date range if provided
   */
  static validateFilteringOptions(options: FilteringOptions): void {
    if (options.status && !['success', 'failed', 'skipped'].includes(options.status)) {
      throw new BusinessRuleViolationError(
        'Invalid status filter value',
        { status: options.status }
      );
    }

    if (options.dateRange) {
      if (options.dateRange.startDate >= options.dateRange.endDate) {
        throw new BusinessRuleViolationError(
          'Start date must be before end date',
          { dateRange: options.dateRange }
        );
      }
    }
  }

  /**
   * Validate sorting options
   * 
   * AI INSTRUCTIONS:
   * - Validate sorting parameters
   * - Check for valid sort fields and orders
   * - Use domain-specific error types
   */
  static validateSortingOptions(options: SortingOptions): void {
    if (options.sortBy && !['crawledAt', 'url', 'status'].includes(options.sortBy)) {
      throw new BusinessRuleViolationError(
        'Invalid sort field',
        { sortBy: options.sortBy }
      );
    }

    if (options.sortOrder && !['asc', 'desc'].includes(options.sortOrder)) {
      throw new BusinessRuleViolationError(
        'Invalid sort order',
        { sortOrder: options.sortOrder }
      );
    }
  }
} 