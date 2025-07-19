/**
 * Vector Cache Initialization Logger
 * 
 * Domain service responsible for logging vector cache initialization and configuration
 * following DDD principles for the chatbot domain.
 */

import { ISessionLogger } from '../../interfaces/IChatbotLoggingService';
import { VectorCacheConfig } from '../../../types/VectorCacheTypes';
import { VectorCacheStatisticsService } from '../../VectorCacheStatisticsService';

export class VectorCacheInitializationLogger {
  
  /**
   * Log vector cache initialization start with configuration
   * 
   * Provides visibility into cache setup process and configuration parameters
   */
  static logInitializationStart(
    logger: ISessionLogger,
    vectorCount: number,
    config: Required<VectorCacheConfig>,
    organizationId: string
  ): void {
    logger.logStep('Vector Cache Initialization with Memory Management');
    logger.logMessage(`Loading ${vectorCount} knowledge vectors into memory`);
    logger.logMessage(`📊 Memory limit: ${config.maxMemoryKB} KB, Vector limit: ${config.maxVectors}`);
    logger.logMessage(`📊 Organization: ${organizationId}`);
    logger.logMessage(`📊 LRU Eviction: disabled (serverless optimized)`);
    logger.logMessage(`📊 Eviction batch size: ${config.evictionBatchSize}`);
  }

  /**
   * Log cache initialization results and metrics
   */
  static logInitializationResults(
    logger: ISessionLogger,
    metrics: ReturnType<typeof VectorCacheStatisticsService.generateInitializationMetrics>
  ): void {
    logger.logMessage(`✅ Cache initialized successfully`);
    logger.logMessage(`📊 Vectors loaded: ${metrics.vectorsLoaded}`);
    logger.logMessage(`📊 Vectors evicted: ${metrics.vectorsEvicted}`);
    logger.logMessage(`📊 Memory usage: ${metrics.memoryUsageKB} KB (${metrics.memoryUtilization.toFixed(1)}% of limit)`);
    logger.logMessage(`📊 Average vector size: ${metrics.averageVectorSize} dimensions`);
    logger.logMessage(`📊 Data Source: In-memory vector cache (no database queries)`);
    
    // Log metrics for monitoring
    logger.logMetrics('vector-cache-init', {
      duration: metrics.initializationTimeMs,
      customMetrics: {
        vectorsLoaded: metrics.vectorsLoaded,
        vectorsEvicted: metrics.vectorsEvicted,
        memoryUsageKB: metrics.memoryUsageKB,
        memoryUtilization: metrics.memoryUtilization,
        averageVectorSize: metrics.averageVectorSize
      }
    });
  }

  /**
   * Log initialization configuration details
   */
  static logConfigurationDetails(
    logger: ISessionLogger,
    config: Required<VectorCacheConfig>
  ): void {
    logger.logMessage('📊 Vector Cache Configuration:');
    logger.logMessage(`  Max Memory: ${config.maxMemoryKB} KB`);
    logger.logMessage(`  Max Vectors: ${config.maxVectors}`);
    logger.logMessage(`  Eviction Batch Size: ${config.evictionBatchSize}`);
    logger.logMessage(`  Auto-eviction: Disabled (serverless optimized)`);
  }

  /**
   * Log initialization error with context
   */
  static logInitializationError(
    logger: ISessionLogger,
    error: Error,
    context: {
      vectorCount: number;
      organizationId: string;
      config: VectorCacheConfig;
    }
  ): void {
    logger.logMessage('❌ Vector Cache Initialization Failed:');
    logger.logMessage(`  Error: ${error.message}`);
    logger.logMessage(`  Vector Count: ${context.vectorCount}`);
    logger.logMessage(`  Organization: ${context.organizationId}`);
    logger.logMessage(`  Max Memory: ${context.config.maxMemoryKB} KB`);
    logger.logError(error);
  }

  /**
   * Log initialization warning conditions
   */
  static logInitializationWarnings(
    logger: ISessionLogger,
    warnings: {
      memoryLimitExceeded?: boolean;
      vectorLimitExceeded?: boolean;
      lowMemoryAvailable?: boolean;
      evictionsRequired?: number;
    }
  ): void {
    if (warnings.memoryLimitExceeded) {
      logger.logMessage('⚠️ Warning: Memory limit exceeded during initialization');
    }
    
    if (warnings.vectorLimitExceeded) {
      logger.logMessage('⚠️ Warning: Vector count limit exceeded during initialization');
    }
    
    if (warnings.lowMemoryAvailable) {
      logger.logMessage('⚠️ Warning: Low memory available for vector cache');
    }
    
    if (warnings.evictionsRequired) {
      logger.logMessage(`⚠️ Warning: ${warnings.evictionsRequired} vectors will be evicted to fit memory limits`);
    }
  }

  /**
   * Log initialization performance analysis
   */
  static logPerformanceAnalysis(
    logger: ISessionLogger,
    metrics: {
      initializationTimeMs: number;
      vectorsPerSecond: number;
      memoryLoadRate: number;
      bottleneck?: string;
    }
  ): void {
    logger.logMessage('📊 Initialization Performance Analysis:');
    logger.logMessage(`  Duration: ${metrics.initializationTimeMs}ms`);
    logger.logMessage(`  Processing Rate: ${metrics.vectorsPerSecond.toFixed(0)} vectors/second`);
    logger.logMessage(`  Memory Load Rate: ${metrics.memoryLoadRate.toFixed(1)} KB/second`);
    
    if (metrics.bottleneck) {
      logger.logMessage(`  Bottleneck: ${metrics.bottleneck}`);
    }
    
    // Performance recommendations
    if (metrics.initializationTimeMs > 10000) {
      logger.logMessage('💡 Recommendation: Consider reducing vector count or increasing memory limits');
    }
    
    if (metrics.vectorsPerSecond < 100) {
      logger.logMessage('💡 Recommendation: Vector processing rate is low, check for I/O bottlenecks');
    }
  }
}