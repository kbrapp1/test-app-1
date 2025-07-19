/**
 * Vector Cache State Logger
 * 
 * Domain service responsible for logging vector cache state changes and management
 * following DDD principles for the chatbot domain.
 */

import { ISessionLogger } from '../../interfaces/IChatbotLoggingService';
import { VectorCacheStats } from '../../../types/VectorCacheTypes';

export class VectorCacheStateLogger {
  
  /**
   * Log cache state and statistics
   */
  static logCacheState(
    logger: ISessionLogger,
    stats: VectorCacheStats,
    operation?: string
  ): void {
    const prefix = operation ? `[${operation}] ` : '';
    
    logger.logMessage(`${prefix}📊 Vector Cache State:`);
    logger.logMessage(`  Total Vectors: ${stats.totalVectors}`);
    logger.logMessage(`  Memory Usage: ${stats.memoryUsageKB} KB`);
    logger.logMessage(`  Cache Hit Rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`);
    logger.logMessage(`  Efficiency: ${stats.totalVectors > 0 ? 'Optimal' : 'Empty Cache'}`);
  }

  /**
   * Log cache state updates with before/after comparison
   */
  static logCacheStateUpdate(
    logger: ISessionLogger,
    operation: string,
    beforeStats: VectorCacheStats,
    afterStats: VectorCacheStats
  ): void {
    logger.logMessage(`📊 Cache State Update [${operation}]:`);
    logger.logMessage(`  Vectors: ${beforeStats.totalVectors} → ${afterStats.totalVectors}`);
    logger.logMessage(`  Memory: ${beforeStats.memoryUsageKB}KB → ${afterStats.memoryUsageKB}KB`);
    logger.logMessage(`  Hit Rate: ${(beforeStats.cacheHitRate * 100).toFixed(1)}% → ${(afterStats.cacheHitRate * 100).toFixed(1)}%`);

    // Calculate changes
    const vectorChange = afterStats.totalVectors - beforeStats.totalVectors;
    const memoryChange = afterStats.memoryUsageKB - beforeStats.memoryUsageKB;
    
    if (vectorChange !== 0) {
      const changeType = vectorChange > 0 ? 'Added' : 'Removed';
      logger.logMessage(`  ${changeType}: ${Math.abs(vectorChange)} vectors`);
    }
    
    if (memoryChange !== 0) {
      const changeType = memoryChange > 0 ? 'Allocated' : 'Freed';
      logger.logMessage(`  Memory ${changeType}: ${Math.abs(memoryChange)} KB`);
    }
  }

  /**
   * Log memory eviction events
   */
  static logMemoryEviction(
    logger: ISessionLogger,
    evictedCount: number,
    memoryFreedKB: number,
    reason: string,
    details?: {
      beforeVectorCount: number;
      afterVectorCount: number;
      evictionStrategy?: string;
    }
  ): void {
    logger.logMessage(`🗑️ Memory Eviction Event:`);
    logger.logMessage(`  Vectors Evicted: ${evictedCount}`);
    logger.logMessage(`  Memory Freed: ${memoryFreedKB}KB`);
    logger.logMessage(`  Reason: ${reason}`);
    
    if (details) {
      logger.logMessage(`  Before: ${details.beforeVectorCount} vectors`);
      logger.logMessage(`  After: ${details.afterVectorCount} vectors`);
      
      if (details.evictionStrategy) {
        logger.logMessage(`  Strategy: ${details.evictionStrategy}`);
      }
    }
  }

  /**
   * Log cache clear operations
   */
  static logCacheClear(
    logger: ISessionLogger,
    vectorsCleared: number,
    memoryFreedKB: number,
    reason?: string,
    details?: {
      clearType: 'full' | 'partial' | 'selective';
      criteria?: string;
    }
  ): void {
    logger.logMessage(`🧹 Cache Clear Operation:`);
    logger.logMessage(`  Vectors Cleared: ${vectorsCleared}`);
    logger.logMessage(`  Memory Freed: ${memoryFreedKB}KB`);
    
    if (reason) {
      logger.logMessage(`  Reason: ${reason}`);
    }
    
    if (details) {
      logger.logMessage(`  Clear Type: ${details.clearType}`);
      
      if (details.criteria) {
        logger.logMessage(`  Criteria: ${details.criteria}`);
      }
    }
  }

  /**
   * Log cache health status
   */
  static logCacheHealth(
    logger: ISessionLogger,
    stats: VectorCacheStats,
    healthMetrics: {
      memoryUtilization: number;
      fragmentationLevel?: number;
      averageVectorSize?: number;
      cacheEfficiency: number;
    }
  ): void {
    logger.logMessage('🏥 Cache Health Assessment:');
    
    // Memory health
    const memoryStatus = healthMetrics.memoryUtilization > 0.9 ? '🔴 Critical' : 
                        healthMetrics.memoryUtilization > 0.7 ? '🟡 Warning' : '🟢 Good';
    logger.logMessage(`  Memory Status: ${memoryStatus} (${(healthMetrics.memoryUtilization * 100).toFixed(1)}%)`);
    
    // Cache efficiency
    const efficiencyStatus = healthMetrics.cacheEfficiency > 0.8 ? '🟢 Excellent' :
                            healthMetrics.cacheEfficiency > 0.6 ? '🟡 Good' : '🔴 Poor';
    logger.logMessage(`  Cache Efficiency: ${efficiencyStatus} (${(healthMetrics.cacheEfficiency * 100).toFixed(1)}%)`);
    
    // Vector statistics
    logger.logMessage(`  Total Vectors: ${stats.totalVectors}`);
    logger.logMessage(`  Hit Rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`);
    
    if (healthMetrics.averageVectorSize) {
      logger.logMessage(`  Avg Vector Size: ${healthMetrics.averageVectorSize} dimensions`);
    }
    
    if (healthMetrics.fragmentationLevel !== undefined) {
      const fragStatus = healthMetrics.fragmentationLevel > 0.3 ? '🔴 High' :
                        healthMetrics.fragmentationLevel > 0.1 ? '🟡 Medium' : '🟢 Low';
      logger.logMessage(`  Fragmentation: ${fragStatus} (${(healthMetrics.fragmentationLevel * 100).toFixed(1)}%)`);
    }
  }

  /**
   * Log cache optimization recommendations
   */
  static logOptimizationRecommendations(
    logger: ISessionLogger,
    stats: VectorCacheStats,
    analysis: {
      shouldEvict: boolean;
      shouldExpand: boolean;
      shouldDefragment: boolean;
      memoryPressure: 'low' | 'medium' | 'high';
    }
  ): void {
    logger.logMessage('💡 Cache Optimization Recommendations:');
    
    const recommendations: string[] = [];
    
    if (analysis.shouldEvict) {
      recommendations.push('Consider evicting least recently used vectors');
    }
    
    if (analysis.shouldExpand) {
      recommendations.push('Cache could benefit from memory expansion');
    }
    
    if (analysis.shouldDefragment) {
      recommendations.push('Memory fragmentation detected, consider defragmentation');
    }
    
    if (analysis.memoryPressure === 'high') {
      recommendations.push('High memory pressure - implement aggressive eviction');
    } else if (analysis.memoryPressure === 'medium') {
      recommendations.push('Moderate memory pressure - monitor closely');
    }
    
    if (stats.cacheHitRate < 0.5) {
      recommendations.push('Low cache hit rate - review caching strategy');
    }
    
    if (stats.totalVectors === 0) {
      recommendations.push('Empty cache - ensure proper initialization');
    }
    
    if (recommendations.length === 0) {
      logger.logMessage('  Cache is operating optimally');
    } else {
      recommendations.forEach((rec, index) => {
        logger.logMessage(`  ${index + 1}. ${rec}`);
      });
    }
  }
}