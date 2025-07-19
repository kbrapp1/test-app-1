/**
 * Vector Cache Logging Service (DEPRECATED - Consolidated into SearchMetricsLoggingService)
 * 
 * AI INSTRUCTIONS:
 * - This service is deprecated and will be removed
 * - All functionality has been moved to SearchMetricsLoggingService
 * - This file provides compatibility delegates for existing code
 * - DO NOT add new functionality here
 */

import { SearchMetricsLoggingService } from './knowledge-processing/SearchMetricsLoggingService';

/**
 * @deprecated Use SearchMetricsLoggingService instead
 * This service provides compatibility delegates to maintain existing functionality
 */
export class VectorCacheLoggingService {
  
  /**
   * @deprecated Use SearchMetricsLoggingService.logVectorCacheInitializationStart
   */
  static logInitializationStart = SearchMetricsLoggingService.logVectorCacheInitializationStart;

  /**
   * @deprecated Use SearchMetricsLoggingService.logVectorCacheInitializationResults
   */
  static logInitializationResults = SearchMetricsLoggingService.logVectorCacheInitializationResults;

  /**
   * @deprecated Use SearchMetricsLoggingService.logVectorSearchStart
   */
  static logSearchStart = SearchMetricsLoggingService.logVectorSearchStart;

  /**
   * @deprecated Use SearchMetricsLoggingService.logSearchResults
   */
  static logSearchResults = SearchMetricsLoggingService.logSearchResults;

  /**
   * @deprecated Use SearchMetricsLoggingService.logSearchMetricsLegacy
   */
  static logSearchMetrics = SearchMetricsLoggingService.logSearchMetricsLegacy;

  /**
   * @deprecated Use SearchMetricsLoggingService.logCacheStateUpdate
   */
  static logCacheStateUpdate = SearchMetricsLoggingService.logCacheStateUpdate;

  /**
   * @deprecated Use SearchMetricsLoggingService.logMemoryEviction
   */
  static logMemoryEviction = SearchMetricsLoggingService.logMemoryEviction;

  /**
   * @deprecated Use SearchMetricsLoggingService.logCacheClear
   */
  static logCacheClear = SearchMetricsLoggingService.logCacheClear;

  /**
   * @deprecated Use SearchMetricsLoggingService.logVectorCacheState
   */
  static logCacheState = SearchMetricsLoggingService.logCacheState;

  /**
   * @deprecated Use SearchMetricsLoggingService.logError
   */
  static logError = SearchMetricsLoggingService.logError;
}