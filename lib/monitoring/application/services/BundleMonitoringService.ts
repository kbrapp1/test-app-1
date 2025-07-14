/**
 * Bundle Monitoring Service (Application Layer)
 * 
 * Single Responsibility: Coordinate bundle performance monitoring use cases
 * Orchestrates domain and infrastructure services for bundle optimization tracking
 */

import { BundlePerformanceMetrics, BundleLoadMetrics, BundleCacheMetrics, BundleEfficiencyMetrics } from '../../domain/entities/BundlePerformanceMetrics';

export interface BundleModuleReport {
  moduleId: string;
  moduleName: string;
  metrics: BundlePerformanceMetrics;
  trends: {
    loadTimeImprovement: number;
    cacheHitImprovement: number;
    overallScoreChange: number;
  };
}

export interface GlobalBundleStats {
  totalModules: number;
  averagePerformanceScore: number;
  totalCacheHitRatio: number;
  criticalPathOptimized: boolean;
  lazyLoadingCoverage: number;
  recommendations: string[];
}

export class BundleMonitoringService {
  private static moduleMetrics: Map<string, BundlePerformanceMetrics[]> = new Map();
  private readonly maxMetricsHistory = 50;
  
  // Session-level tracking
  private sessionStartTime: Date = new Date();
  private static globalLoadMetrics: BundleLoadMetrics[] = [];

  constructor() {
    this.initializeMonitoring();
  }

  /**
   * Track bundle performance metrics for a specific module
   */
  trackBundleMetrics(
    moduleId: string,
    loadMetrics: BundleLoadMetrics,
    cacheMetrics: BundleCacheMetrics,
    efficiencyMetrics: BundleEfficiencyMetrics
  ): string {
    const metrics = new BundlePerformanceMetrics(
      this.generateMetricsId(),
      new Date(),
      moduleId,
      loadMetrics,
      cacheMetrics,
      efficiencyMetrics,
      0 // Will be calculated
    );

    // Calculate performance score
    const performanceScore = metrics.calculateOverallScore();
    const updatedMetrics = new BundlePerformanceMetrics(
      metrics.id,
      metrics.timestamp,
      metrics.moduleId,
      metrics.loadMetrics,
      metrics.cacheMetrics,
      metrics.efficiencyMetrics,
      performanceScore
    );

    // Store metrics
    if (!BundleMonitoringService.moduleMetrics.has(moduleId)) {
      BundleMonitoringService.moduleMetrics.set(moduleId, []);
    }

    const moduleHistory = BundleMonitoringService.moduleMetrics.get(moduleId)!;
    moduleHistory.unshift(updatedMetrics);

    // Keep history manageable
    if (moduleHistory.length > this.maxMetricsHistory) {
      BundleMonitoringService.moduleMetrics.set(moduleId, moduleHistory.slice(0, this.maxMetricsHistory));
    }

    // Track global metrics
    BundleMonitoringService.globalLoadMetrics.unshift(loadMetrics);
    if (BundleMonitoringService.globalLoadMetrics.length > this.maxMetricsHistory) {
      BundleMonitoringService.globalLoadMetrics = BundleMonitoringService.globalLoadMetrics.slice(0, this.maxMetricsHistory);
    }

    return metrics.id;
  }

  /**
   * Get latest bundle metrics for a specific module
   */
  getModuleMetrics(moduleId: string): BundlePerformanceMetrics | null {
    const history = BundleMonitoringService.moduleMetrics.get(moduleId);
    return history?.[0] || null;
  }

  /**
   * Get comprehensive bundle statistics across all modules
   */
  getGlobalBundleStats(): GlobalBundleStats {
    const allModules = Array.from(BundleMonitoringService.moduleMetrics.keys());
    const latestMetrics = allModules
      .map(moduleId => this.getModuleMetrics(moduleId))
      .filter(Boolean) as BundlePerformanceMetrics[];

    if (latestMetrics.length === 0) {
      return this.getEmptyStats();
    }

    const averagePerformanceScore = latestMetrics.reduce(
      (sum, metrics) => sum + metrics.performanceScore, 0
    ) / latestMetrics.length;

    const totalCacheHitRatio = latestMetrics.reduce(
      (sum, metrics) => sum + metrics.cacheMetrics.hitRatio, 0
    ) / latestMetrics.length;

    const lazyLoadingCoverage = latestMetrics.filter(
      metrics => metrics.efficiencyMetrics.lazyLoadingEnabled
    ).length / latestMetrics.length;

    const criticalPathOptimized = latestMetrics.every(
      metrics => metrics.loadMetrics.criticalPathSize <= metrics.loadMetrics.totalBundleSize * 0.3
    );

    // Aggregate recommendations
    const allRecommendations = new Set<string>();
    latestMetrics.forEach(metrics => {
      metrics.getOptimizationRecommendations().forEach(rec => 
        allRecommendations.add(rec)
      );
    });

    return {
      totalModules: allModules.length,
      averagePerformanceScore: Math.round(averagePerformanceScore),
      totalCacheHitRatio: Math.round(totalCacheHitRatio * 100) / 100,
      criticalPathOptimized,
      lazyLoadingCoverage: Math.round(lazyLoadingCoverage * 100) / 100,
      recommendations: Array.from(allRecommendations)
    };
  }

  /**
   * Get detailed module report with trends
   */
  getModuleReport(moduleId: string): BundleModuleReport | null {
    const history = BundleMonitoringService.moduleMetrics.get(moduleId);
    if (!history || history.length === 0) return null;

    const latest = history[0];
    const previous = history[1];

    const trends = {
      loadTimeImprovement: previous ? 
        previous.loadMetrics.initialLoadTime - latest.loadMetrics.initialLoadTime : 0,
      cacheHitImprovement: previous ?
        latest.cacheMetrics.hitRatio - previous.cacheMetrics.hitRatio : 0,
      overallScoreChange: previous ?
        latest.performanceScore - previous.performanceScore : 0
    };

    return {
      moduleId,
      moduleName: this.getModuleName(moduleId),
      metrics: latest,
      trends
    };
  }

  /**
   * Get performance metrics for monitoring dashboard integration
   */
  getPerformanceMetrics() {
    const globalStats = this.getGlobalBundleStats();
    const sessionDuration = Date.now() - this.sessionStartTime.getTime();

    return {
      bundle: globalStats,
      session: {
        duration: sessionDuration,
        modulesTracked: BundleMonitoringService.moduleMetrics.size,
        totalMetricsCollected: this.getTotalMetricsCollected(),
        averageLoadTime: this.calculateAverageLoadTime()
      },
      performance: {
        criticalPathOptimized: globalStats.criticalPathOptimized,
        lazyLoadingCoverage: globalStats.lazyLoadingCoverage,
        overallHealth: this.calculateOverallHealth(globalStats)
      }
    };
  }

  /**
   * Clear all bundle monitoring data
   */
  clear(): void {
    BundleMonitoringService.moduleMetrics.clear();
    BundleMonitoringService.globalLoadMetrics = [];
    this.sessionStartTime = new Date();
  }

  /**
   * Get metrics for specific time range
   */
  getMetricsForTimeRange(moduleId: string, startTime: Date, endTime: Date): BundlePerformanceMetrics[] {
    const history = BundleMonitoringService.moduleMetrics.get(moduleId) || [];
    return history.filter(metrics => 
      metrics.timestamp >= startTime && metrics.timestamp <= endTime
    );
  }

  private initializeMonitoring(): void {
    // Set up performance observers for automatic tracking
    if (typeof window !== 'undefined' && window.PerformanceObserver) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach(entry => {
            if (entry.name.startsWith('bundle-')) {
              this.handlePerformanceEntry(entry);
            }
          });
        });
        observer.observe({ entryTypes: ['measure', 'mark'] });
      } catch {
        // PerformanceObserver not supported, monitoring will be manual
      }
    }
  }

  private handlePerformanceEntry(_entry: PerformanceEntry): void {
    // Process performance entries related to bundle loading
    // This integrates with Performance API marks we set in LazyProviderLoader
  }

  private generateMetricsId(): string {
    return `bundle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getModuleName(moduleId: string): string {
    const moduleNames: Record<string, string> = {
      'image-generator': 'Image Generator',
      'dam': 'Digital Asset Management',
      'monitoring': 'Performance Monitoring',
      'auth': 'Authentication'
    };
    return moduleNames[moduleId] || moduleId;
  }

  private getEmptyStats(): GlobalBundleStats {
    return {
      totalModules: 0,
      averagePerformanceScore: 0,
      totalCacheHitRatio: 0,
      criticalPathOptimized: false,
      lazyLoadingCoverage: 0,
      recommendations: ['No modules being monitored']
    };
  }

  private getTotalMetricsCollected(): number {
    return Array.from(BundleMonitoringService.moduleMetrics.values())
      .reduce((total, history) => total + history.length, 0);
  }

  private calculateAverageLoadTime(): number {
    if (BundleMonitoringService.globalLoadMetrics.length === 0) return 0;
    
    const totalLoadTime = BundleMonitoringService.globalLoadMetrics.reduce(
      (sum, metrics) => sum + metrics.initialLoadTime, 0
    );
    return Math.round(totalLoadTime / BundleMonitoringService.globalLoadMetrics.length);
  }

  private calculateOverallHealth(stats: GlobalBundleStats): 'excellent' | 'good' | 'poor' {
    if (stats.averagePerformanceScore >= 90 && stats.totalCacheHitRatio >= 0.85) {
      return 'excellent';
    } else if (stats.averagePerformanceScore >= 60 && stats.totalCacheHitRatio >= 0.7) {
      return 'good';
    } else {
      return 'poor';
    }
  }
} 