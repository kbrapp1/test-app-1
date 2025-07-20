/**
 * Vector Search Error Logger
 * 
 * Domain service specialized for logging vector search and similarity matching errors.
 * Focuses on vector operations, cache performance, and search algorithm issues.
 */

import { ISessionLogger } from '../../interfaces/IChatbotLoggingService';
import { VectorSearchError } from '../../../errors/KnowledgeProcessingError';

export interface VectorSearchErrorContext {
  cacheSize: number;
  queryDimensions: number;
  threshold: number;
  limit: number;
  searchTimeMs?: number;
  algorithmUsed?: string;
  indexType?: string;
}

export class VectorSearchErrorLogger {
  
  /**
   * Log vector search errors with detailed context
   */
  static logVectorSearchError(
    logger: ISessionLogger,
    error: Error | VectorSearchError,
    context: VectorSearchErrorContext
  ): void {
    logger.logMessage('❌ Vector Search Error:');
    logger.logMessage(`  Error: ${error.message}`);
    logger.logMessage(`  Cache Size: ${context.cacheSize} vectors`);
    logger.logMessage(`  Query Dimensions: ${context.queryDimensions}`);
    logger.logMessage(`  Similarity Threshold: ${context.threshold}`);
    logger.logMessage(`  Result Limit: ${context.limit}`);
    
    if (context.algorithmUsed) {
      logger.logMessage(`  Algorithm: ${context.algorithmUsed}`);
    }

    if (context.indexType) {
      logger.logMessage(`  Index Type: ${context.indexType}`);
    }

    if (context.searchTimeMs) {
      logger.logMessage(`  Duration Before Error: ${context.searchTimeMs}ms`);
    }
    
    logger.logError(error);

    // Log performance metrics
    logger.logMetrics('vector-search-error', {
      duration: context.searchTimeMs || 0,
      customMetrics: {
        cacheSize: context.cacheSize,
        queryDimensions: context.queryDimensions,
        threshold: context.threshold,
        resultLimit: context.limit,
        isLargeCache: context.cacheSize > 10000 ? 1 : 0,
        isHighDimensional: context.queryDimensions > 1000 ? 1 : 0
      }
    });
  }

  /**
   * Log vector dimension mismatch errors
   */
  static logDimensionMismatchError(
    logger: ISessionLogger,
    error: Error,
    context: VectorSearchErrorContext & {
      expectedDimensions: number;
      actualDimensions: number;
      vectorSource: 'query' | 'cache' | 'database';
    }
  ): void {
    logger.logMessage('❌ Vector Dimension Mismatch Error:');
    logger.logMessage(`  Error: ${error.message}`);
    logger.logMessage(`  Expected Dimensions: ${context.expectedDimensions}`);
    logger.logMessage(`  Actual Dimensions: ${context.actualDimensions}`);
    logger.logMessage(`  Vector Source: ${context.vectorSource}`);
    logger.logMessage(`  Cache Size: ${context.cacheSize} vectors`);
    
    const dimensionDrift = Math.abs(context.expectedDimensions - context.actualDimensions);
    logger.logMessage(`  Dimension Drift: ${dimensionDrift}`);
    
    logger.logError(error);
  }

  /**
   * Log vector search performance degradation
   */
  static logSearchPerformanceIssue(
    logger: ISessionLogger,
    context: VectorSearchErrorContext & {
      actualTimeMs: number;
      expectedTimeMs: number;
      degradationFactor: number;
      possibleCauses?: string[];
    }
  ): void {
    logger.logMessage('⚠️ Vector Search Performance Degradation:');
    logger.logMessage(`  Actual Time: ${context.actualTimeMs}ms`);
    logger.logMessage(`  Expected Time: ${context.expectedTimeMs}ms`);
    logger.logMessage(`  Degradation Factor: ${context.degradationFactor.toFixed(2)}x`);
    logger.logMessage(`  Cache Size: ${context.cacheSize} vectors`);
    logger.logMessage(`  Query Dimensions: ${context.queryDimensions}`);
    
    if (context.possibleCauses && context.possibleCauses.length > 0) {
      logger.logMessage('  Possible Causes:');
      context.possibleCauses.forEach(cause => {
        logger.logMessage(`    - ${cause}`);
      });
    }

    // Log performance metrics for analysis
    logger.logMetrics('vector-search-performance-issue', {
      duration: context.actualTimeMs,
      customMetrics: {
        degradationFactor: context.degradationFactor,
        expectedTime: context.expectedTimeMs,
        cacheSize: context.cacheSize,
        queryDimensions: context.queryDimensions,
        threshold: context.threshold
      }
    });
  }

  /**
   * Log vector search no results found scenarios
   */
  static logNoResultsFound(
    logger: ISessionLogger,
    context: VectorSearchErrorContext & {
      organizationId: string;
      queryAnalysis: {
        isGenericQuery: boolean;
        hasSpecialCharacters: boolean;
        languageDetected?: string;
      };
    }
  ): void {
    logger.logMessage('⚠️ Vector Search - No Results Found:');
    logger.logMessage(`  Organization: ${context.organizationId}`);
    logger.logMessage(`  Cache Size: ${context.cacheSize} vectors`);
    logger.logMessage(`  Similarity Threshold: ${context.threshold}`);
    logger.logMessage(`  Search Limit: ${context.limit}`);
    
    logger.logMessage('  Query Analysis:');
    logger.logMessage(`    Generic Query: ${context.queryAnalysis.isGenericQuery ? 'Yes' : 'No'}`);
    logger.logMessage(`    Special Characters: ${context.queryAnalysis.hasSpecialCharacters ? 'Yes' : 'No'}`);
    
    if (context.queryAnalysis.languageDetected) {
      logger.logMessage(`    Language: ${context.queryAnalysis.languageDetected}`);
    }

    if (context.searchTimeMs) {
      logger.logMessage(`  Search Duration: ${context.searchTimeMs}ms`);
    }

    // Suggest threshold adjustment if cache has vectors
    if (context.cacheSize > 0) {
      const suggestedThreshold = Math.max(0.1, context.threshold - 0.1);
      logger.logMessage(`  Suggestion: Try lowering threshold to ${suggestedThreshold}`);
    }
  }
}