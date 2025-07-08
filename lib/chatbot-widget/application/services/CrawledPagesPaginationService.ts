import { BusinessRuleViolationError } from '../../domain/errors/ChatbotWidgetDomainErrors';
import { CrawledPageData, PaginationOptions, PaginationResult } from '../types/CrawledPagesTypes';

/** Crawled Pages Pagination Service */
export class CrawledPagesPaginationService {

  /** Default pagination limits */
  static readonly DEFAULT_LIMIT = 50;
  static readonly MAX_LIMIT = 1000;
  static readonly MIN_LIMIT = 1;

  /** Apply pagination to crawled pages */
  static applyPagination<T extends CrawledPageData>(
    pages: T[],
    options: PaginationOptions
  ): PaginationResult<T> {
    // Validate pagination options
    this.validatePaginationOptions(options);

    const limit = options.limit || this.DEFAULT_LIMIT;
    const offset = options.offset || 0;

    // Handle empty dataset
    if (pages.length === 0) {
      return {
        pages: [],
        hasMore: false
      };
    }

    // Apply pagination
    const paginatedPages = pages.slice(offset, offset + limit);
    const hasMore = offset + limit < pages.length;

    return {
      pages: paginatedPages,
      hasMore
    };
  }

  /**
   * Calculate pagination metadata
   * 
   * AI INSTRUCTIONS:
   * - Provide comprehensive pagination information
   * - Calculate total pages and current page
   * - Handle edge cases for metadata calculation
   */
  static calculatePaginationMetadata(
    totalItems: number,
    options: PaginationOptions
  ) {
    const limit = options.limit || this.DEFAULT_LIMIT;
    const offset = options.offset || 0;

    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = Math.floor(offset / limit) + 1;
    const hasNextPage = offset + limit < totalItems;
    const hasPreviousPage = offset > 0;

    return {
      totalItems,
      totalPages,
      currentPage,
      limit,
      offset,
      hasNextPage,
      hasPreviousPage
    };
  }

  /** Get pagination boundaries */
  static getPaginationBoundaries(
    totalItems: number,
    options: PaginationOptions
  ) {
    const limit = options.limit || this.DEFAULT_LIMIT;
    const offset = options.offset || 0;

    const startIndex = Math.max(0, offset);
    const endIndex = Math.min(totalItems, offset + limit);

    return {
      startIndex,
      endIndex,
      itemCount: endIndex - startIndex
    };
  }

  /**
   * Validate pagination options
   * 
   * AI INSTRUCTIONS:
   * - Validate limit and offset parameters
   * - Use domain-specific error types
   * - Check for reasonable pagination limits
   * - Ensure non-negative values
   */
  static validatePaginationOptions(options: PaginationOptions): void {
    if (options.limit !== undefined) {
      if (!Number.isInteger(options.limit) || options.limit < this.MIN_LIMIT) {
        throw new BusinessRuleViolationError(
          `Limit must be a positive integer greater than or equal to ${this.MIN_LIMIT}`,
          { limit: options.limit, minLimit: this.MIN_LIMIT }
        );
      }

      if (options.limit > this.MAX_LIMIT) {
        throw new BusinessRuleViolationError(
          `Limit cannot exceed ${this.MAX_LIMIT}`,
          { limit: options.limit, maxLimit: this.MAX_LIMIT }
        );
      }
    }

    if (options.offset !== undefined) {
      if (!Number.isInteger(options.offset) || options.offset < 0) {
        throw new BusinessRuleViolationError(
          'Offset must be a non-negative integer',
          { offset: options.offset }
        );
      }
    }
  }

  /** Create pagination options with defaults */
  static createPaginationOptions(
    limit?: number,
    offset?: number
  ): PaginationOptions {
    const options: PaginationOptions = {
      limit: limit || this.DEFAULT_LIMIT,
      offset: offset || 0
    };

    this.validatePaginationOptions(options);

    return options;
  }

  /** Calculate next page offset */
  static getNextPageOffset(
    currentOffset: number,
    limit: number,
    totalItems: number
  ): number | null {
    const nextOffset = currentOffset + limit;
    return nextOffset < totalItems ? nextOffset : null;
  }

  /** Calculate previous page offset */
  static getPreviousPageOffset(
    currentOffset: number,
    limit: number
  ): number | null {
    if (currentOffset <= 0) {
      return null;
    }

    const previousOffset = Math.max(0, currentOffset - limit);
    return previousOffset;
  }
} 