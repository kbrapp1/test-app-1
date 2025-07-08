import { 
  CachedKnowledgeVector,
  VectorCacheStats,
  VectorCacheConfig,
  VectorSearchMetrics,
  VectorCacheInitializationMetrics
} from '../types/VectorCacheTypes';
import { VectorMemoryManagementService } from './VectorMemoryManagementService';

/** Vector Cache Statistics Service */
export class VectorCacheStatisticsService {

  /** Calculate comprehensive cache statistics */
  static calculateCacheStats(
    vectorCache: Map<string, CachedKnowledgeVector>,
    config: Required<VectorCacheConfig>,
    searchCount: number,
    cacheHits: number,
    evictionsPerformed: number,
    initializationTime: Date | null
  ): VectorCacheStats {
    const memoryUsageKB = VectorMemoryManagementService.calculateMemoryUsage(vectorCache);
    const memoryUtilization = VectorMemoryManagementService.getMemoryUtilization(vectorCache, config);
    const cacheHitRate = this.calculateCacheHitRate(searchCount, cacheHits);

    return {
      totalVectors: vectorCache.size,
      memoryUsageKB,
      memoryLimitKB: config.maxMemoryKB,
      memoryUtilization,
      cacheHitRate,
      searchesPerformed: searchCount,
      cacheHits,
      evictionsPerformed,
      lastUpdated: initializationTime || new Date()
    };
  }

  /**
   * Calculate cache hit rate percentage
   * 
   * AI INSTRUCTIONS:
   * - Calculate percentage of successful cache hits
   * - Handle edge cases like zero searches
   * - Return value between 0 and 1
   */
  static calculateCacheHitRate(searchCount: number, cacheHits: number): number {
    if (searchCount <= 0) return 1.0; // Perfect hit rate when no searches performed
    return Math.min(1.0, cacheHits / searchCount);
  }

  /** Generate search performance metrics */
  static generateSearchMetrics(
    searchTimeMs: number,
    vectorsSearched: number,
    resultsFound: number,
    cacheHitRate: number,
    memoryUtilization: number,
    searchThreshold: number
  ): VectorSearchMetrics {
    return {
      searchTimeMs,
      vectorsSearched,
      resultsFound,
      cacheHitRate,
      memoryUtilization,
      searchThreshold
    };
  }

  /** Generate initialization performance metrics */
  static generateInitializationMetrics(
    initializationTimeMs: number,
    vectorsLoaded: number,
    vectorsEvicted: number,
    memoryUsageKB: number,
    memoryLimitKB: number,
    averageVectorSize: number
  ): VectorCacheInitializationMetrics {
    const memoryUtilization = memoryLimitKB > 0 ? (memoryUsageKB / memoryLimitKB) * 100 : 0;

    return {
      initializationTimeMs,
      vectorsLoaded,
      vectorsEvicted,
      memoryUsageKB,
      memoryUtilization,
      averageVectorSize
    };
  }

  /**
   * Calculate cache efficiency metrics
   * 
   * AI INSTRUCTIONS:
   * - Analyze cache efficiency and performance
   * - Provide insights for optimization
   * - Calculate derived metrics for monitoring
   */
  static calculateEfficiencyMetrics(
    vectorCache: Map<string, CachedKnowledgeVector>,
    config: Required<VectorCacheConfig>,
    searchCount: number,
    evictionsPerformed: number
  ) {
    const totalVectors = vectorCache.size;
    const memoryUsageKB = VectorMemoryManagementService.calculateMemoryUsage(vectorCache);
    
    // Calculate efficiency ratios
    const vectorDensity = config.maxVectors > 0 ? totalVectors / config.maxVectors : 0;
    const memoryDensity = config.maxMemoryKB > 0 ? memoryUsageKB / config.maxMemoryKB : 0;
    const evictionRate = searchCount > 0 ? evictionsPerformed / searchCount : 0;
    
    // Calculate access patterns
    const accessCounts = Array.from(vectorCache.values()).map(v => v.accessCount);
    const totalAccesses = accessCounts.reduce((sum, count) => sum + count, 0);
    const averageAccessCount = totalVectors > 0 ? totalAccesses / totalVectors : 0;
    
    // Calculate temporal metrics
    const now = new Date();
    const lastAccessTimes = Array.from(vectorCache.values()).map(v => 
      now.getTime() - v.lastAccessed.getTime()
    );
    const averageTimeSinceAccess = lastAccessTimes.length > 0 
      ? lastAccessTimes.reduce((sum, time) => sum + time, 0) / lastAccessTimes.length
      : 0;

    return {
      vectorDensity,
      memoryDensity,
      evictionRate,
      averageAccessCount,
      averageTimeSinceAccessMs: averageTimeSinceAccess,
      totalAccesses,
      hotVectors: accessCounts.filter(count => count > averageAccessCount).length,
      coldVectors: accessCounts.filter(count => count === 0).length
    };
  }

  /** Generate cache health report */
  static generateHealthReport(
    vectorCache: Map<string, CachedKnowledgeVector>,
    config: Required<VectorCacheConfig>,
    searchCount: number,
    cacheHits: number,
    evictionsPerformed: number
  ) {
    const stats = this.calculateCacheStats(
      vectorCache, 
      config, 
      searchCount, 
      cacheHits, 
      evictionsPerformed, 
      new Date()
    );
    
    const efficiency = this.calculateEfficiencyMetrics(
      vectorCache, 
      config, 
      searchCount, 
      evictionsPerformed
    );

    // Assess health indicators
    const healthIndicators = {
      memoryHealth: stats.memoryUtilization < 90 ? 'good' : stats.memoryUtilization < 95 ? 'warning' : 'critical',
      hitRateHealth: stats.cacheHitRate > 0.95 ? 'excellent' : stats.cacheHitRate > 0.8 ? 'good' : 'poor',
      evictionHealth: efficiency.evictionRate < 0.1 ? 'good' : efficiency.evictionRate < 0.2 ? 'warning' : 'critical',
      accessPatternHealth: efficiency.coldVectors / stats.totalVectors < 0.3 ? 'good' : 'warning'
    };

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (healthIndicators.memoryHealth === 'critical') {
      recommendations.push('Consider increasing memory limit or reducing vector count');
    }
    
    if (healthIndicators.hitRateHealth === 'poor') {
      recommendations.push('Review cache initialization and search patterns');
    }
    
    if (healthIndicators.evictionHealth === 'critical') {
      recommendations.push('Increase eviction batch size or memory limits');
    }
    
    if (efficiency.coldVectors > stats.totalVectors * 0.5) {
      recommendations.push('Consider more aggressive eviction of unused vectors');
    }

    return {
      stats,
      efficiency,
      healthIndicators,
      recommendations,
      overallHealth: this.calculateOverallHealth(healthIndicators)
    };
  }

  /** Calculate overall cache health score */
  private static calculateOverallHealth(healthIndicators: Record<string, string>): string {
    const scores = Object.values(healthIndicators);
    
    if (scores.includes('critical')) return 'critical';
    if (scores.filter(s => s === 'warning').length >= 2) return 'warning';
    if (scores.includes('warning')) return 'warning';
    if (scores.includes('excellent')) return 'excellent';
    
    return 'good';
  }

  /** Track vector access patterns */
  static analyzeAccessPatterns(vectorCache: Map<string, CachedKnowledgeVector>) {
    const vectors = Array.from(vectorCache.values());
    
    if (vectors.length === 0) {
      return {
        totalVectors: 0,
        averageAccessCount: 0,
        hotVectors: [],
        coldVectors: [],
        accessDistribution: {}
      };
    }

    // Calculate access statistics
    const accessCounts = vectors.map(v => v.accessCount);
    const totalAccesses = accessCounts.reduce((sum, count) => sum + count, 0);
    const averageAccessCount = totalAccesses / vectors.length;
    
    // Identify hot and cold vectors
    const hotVectors = vectors
      .filter(v => v.accessCount > averageAccessCount * 2)
      .map(v => ({ id: v.item.id, accessCount: v.accessCount }))
      .sort((a, b) => b.accessCount - a.accessCount);
    
    const coldVectors = vectors
      .filter(v => v.accessCount === 0)
      .map(v => ({ id: v.item.id, lastAccessed: v.lastAccessed }))
      .sort((a, b) => a.lastAccessed.getTime() - b.lastAccessed.getTime());

    // Create access distribution
    const maxAccess = Math.max(...accessCounts);
    const buckets = Math.min(10, maxAccess + 1);
    const bucketSize = maxAccess / buckets;
    const distribution: Record<string, number> = {};
    
    for (let i = 0; i < buckets; i++) {
      const bucketLabel = `${Math.floor(i * bucketSize)}-${Math.floor((i + 1) * bucketSize)}`;
      distribution[bucketLabel] = 0;
    }
    
    accessCounts.forEach(count => {
      const bucketIndex = Math.min(Math.floor(count / bucketSize), buckets - 1);
      const bucketLabel = `${Math.floor(bucketIndex * bucketSize)}-${Math.floor((bucketIndex + 1) * bucketSize)}`;
      distribution[bucketLabel]++;
    });

    return {
      totalVectors: vectors.length,
      averageAccessCount,
      hotVectors: hotVectors.slice(0, 10), // Top 10 hot vectors
      coldVectors: coldVectors.slice(0, 10), // Top 10 cold vectors
      accessDistribution: distribution
    };
  }
} 