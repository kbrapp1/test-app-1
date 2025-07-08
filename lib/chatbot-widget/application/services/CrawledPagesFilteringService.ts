import { BusinessRuleViolationError } from '../../domain/errors/ChatbotWidgetDomainErrors';
import { 
  CrawledPageData, 
  FilteringOptions, 
  SortingOptions, 
  CrawledPageSortField, 
  SortOrder 
} from '../types/CrawledPagesTypes';

/** Crawled Pages Filtering Service */
export class CrawledPagesFilteringService {

  /** Apply filtering to crawled pages */
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

  /** Apply sorting to crawled pages */
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

  /** Apply date filtering to crawled pages */
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

  /** Compare two pages for sorting */
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

  /** Validate filtering options */
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

  /** Validate sorting options */
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