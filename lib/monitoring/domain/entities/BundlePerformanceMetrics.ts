// Bundle Performance Metrics Entity - Monitoring Domain Layer
// Single Responsibility: Represent bundle optimization performance data
// Following Golden Rule: Pure domain entity for monitoring bundle metrics

export interface BundleLoadMetrics {
  initialLoadTime: number;
  componentLoadTimes: Record<string, number>;
  providerLoadTimes: Record<string, number>;
  totalBundleSize: number;
  criticalPathSize: number;
}

export interface BundleCacheMetrics {
  hitRatio: number;
  missCount: number;
  hitCount: number;
  cacheSize: number;
  memoryUsage: number;
}

export interface BundleEfficiencyMetrics {
  lazyLoadingEnabled: boolean;
  dynamicImportsCount: number;
  codeSpittingRatio: number;
  parallelLoadingEnabled: boolean;
}

/**
 * Bundle Performance Metrics Entity
 * Represents comprehensive bundle optimization performance data
 */
export class BundlePerformanceMetrics {
  constructor(
    public readonly id: string,
    public readonly timestamp: Date,
    public readonly moduleId: string,
    public readonly loadMetrics: BundleLoadMetrics,
    public readonly cacheMetrics: BundleCacheMetrics,
    public readonly efficiencyMetrics: BundleEfficiencyMetrics,
    public readonly performanceScore: number
  ) {}

  /**
   * Calculate overall bundle performance score (0-100)
   */
  calculateOverallScore(): number {
    const loadScore = this.calculateLoadScore();
    const cacheScore = this.calculateCacheScore();
    const efficiencyScore = this.calculateEfficiencyScore();
    
    // Weighted average: Load (40%), Cache (35%), Efficiency (25%)
    return Math.round(
      (loadScore * 0.4) + 
      (cacheScore * 0.35) + 
      (efficiencyScore * 0.25)
    );
  }

  /**
   * Get performance improvement recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.loadMetrics.initialLoadTime > 1000) {
      recommendations.push('Consider additional code splitting for faster initial load');
    }
    
    if (this.cacheMetrics.hitRatio < 0.8) {
      recommendations.push('Improve caching strategy to increase hit ratio');
    }
    
    if (!this.efficiencyMetrics.lazyLoadingEnabled) {
      recommendations.push('Enable lazy loading for non-critical components');
    }
    
    if (this.efficiencyMetrics.codeSpittingRatio < 0.3) {
      recommendations.push('Increase code splitting to reduce bundle size');
    }
    
    return recommendations;
  }

  /**
   * Check if metrics meet performance thresholds
   */
  meetsPerformanceThresholds(): boolean {
    return (
      this.loadMetrics.initialLoadTime <= 1000 &&      // < 1 second initial load
      this.cacheMetrics.hitRatio >= 0.8 &&             // 80%+ cache hit ratio
      this.efficiencyMetrics.lazyLoadingEnabled &&     // Lazy loading enabled
      this.performanceScore >= 85                       // 85+ performance score
    );
  }

  private calculateLoadScore(): number {
    // Score based on initial load time (< 500ms = 100, > 2000ms = 0)
    const loadScore = Math.max(0, 100 - (this.loadMetrics.initialLoadTime - 500) / 15);
    return Math.min(100, Math.max(0, loadScore));
  }

  private calculateCacheScore(): number {
    // Score based on cache hit ratio (100% = 100, 0% = 0)
    return this.cacheMetrics.hitRatio * 100;
  }

  private calculateEfficiencyScore(): number {
    let score = 0;
    
    // Lazy loading: 40 points
    if (this.efficiencyMetrics.lazyLoadingEnabled) score += 40;
    
    // Dynamic imports: 30 points
    if (this.efficiencyMetrics.dynamicImportsCount > 0) score += 30;
    
    // Code splitting: 30 points based on ratio
    score += this.efficiencyMetrics.codeSpittingRatio * 30;
    
    return Math.min(100, score);
  }
} 