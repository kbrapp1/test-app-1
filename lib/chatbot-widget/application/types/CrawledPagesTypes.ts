/**
 * Crawled Pages Query Types
 * 
 * AI INSTRUCTIONS:
 * - Central location for all crawled pages query related types
 * - Maintain type safety across all services
 * - Support filtering, sorting, and pagination
 * - Include comprehensive error handling types
 */

export interface CrawledPageData {
  url: string;
  title: string;
  content: string;
  status: CrawledPageStatus;
  statusCode?: number;
  responseTime?: number;
  depth: number;
  crawledAt: Date;
  errorMessage?: string;
}

export type CrawledPageStatus = 'success' | 'failed' | 'skipped';

export type CrawledPageSortField = 'crawledAt' | 'url' | 'status';
export type SortOrder = 'asc' | 'desc';

export interface CrawledPagesQueryRequest {
  organizationId: string;
  chatbotConfigId: string;
  sourceUrl?: string;
  status?: CrawledPageStatus;
  limit?: number;
  offset?: number;
  sortBy?: CrawledPageSortField;
  sortOrder?: SortOrder;
}

export interface CrawledPagesQueryResponse {
  success: boolean;
  crawledPages?: CrawledPageData[];
  totalCount?: number;
  hasMore?: boolean;
  error?: {
    code: string;
    message: string;
    context?: Record<string, unknown>;
  };
}

export interface CrawledPagesStatsRequest {
  organizationId: string;
  chatbotConfigId: string;
  sourceUrl?: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

export interface CrawledPagesStatistics {
  totalPages: number;
  successfulPages: number;
  failedPages: number;
  skippedPages: number;
  successRate: number;
  averageResponseTime: number;
  lastCrawlDate: Date;
  uniqueSourcesCount: number;
  averageDepth: number;
}

export interface CrawledPagesStatsResponse {
  success: boolean;
  stats?: CrawledPagesStatistics;
  error?: {
    code: string;
    message: string;
    context?: Record<string, unknown>;
  };
}

export interface FilteringOptions {
  status?: CrawledPageStatus;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

export interface SortingOptions {
  sortBy?: CrawledPageSortField;
  sortOrder?: SortOrder;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface PaginationResult<T> {
  pages: T[];
  hasMore: boolean;
} 