/**
 * Chat Message Query Services Index
 * 
 * AI INSTRUCTIONS:
 * - Clean export interface for chat message query services
 * - Group related exports logically
 * - Follow @golden-rule patterns exactly
 */

// Basic query operations
export { ChatMessageBasicQueryService } from './ChatMessageBasicQueryService';

// Search functionality
export { ChatMessageSearchService } from './ChatMessageSearchService';
export type { SearchFilters } from './ChatMessageSearchService';

// Analytics and specialized queries
export { ChatMessageAnalyticsQueryService } from './ChatMessageAnalyticsQueryService';
export { ChatMessageAdvancedAnalyticsQueryService } from './ChatMessageAdvancedAnalyticsQueryService';
export { ChatMessagePerformanceQueryService } from './ChatMessagePerformanceQueryService';

// Pagination services
export { ChatMessagePaginationQueryService } from './ChatMessagePaginationQueryService';
export type { PaginatedChatMessages } from './ChatMessagePaginationQueryService'; 