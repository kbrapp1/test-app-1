// Lazy Provider Loader - Infrastructure Layer
// Single Responsibility: Dynamically load provider configurations to optimize bundle size
// Following Golden Rule: Infrastructure service for performance optimization

import { ProviderModel } from '../../domain/value-objects/Provider';
import { BundleMonitoringService } from '../../../monitoring/application/services/BundleMonitoringService';

/**
 * Lazy Provider Configuration Loader
 * Implements dynamic imports to reduce initial bundle size and improve load performance
 * Integrated with global monitoring system for performance tracking
 */
export class LazyProviderLoader {
  private static configCache = new Map<string, ProviderModel[]>();
  private static loadingPromises = new Map<string, Promise<ProviderModel[]>>();
  private static bundleMonitoring = new BundleMonitoringService();
  
  // Performance tracking
  private static loadStartTimes = new Map<string, number>();
  private static cacheHits = 0;
  private static cacheMisses = 0;
  private static componentLoadTimes = new Map<string, number>();

  /**
   * Dynamically load Replicate models configuration
   */
  static async loadReplicateModels(): Promise<ProviderModel[]> {
    const cacheKey = 'replicate';
    const startTime = performance.now();
    this.loadStartTimes.set(cacheKey, startTime);
    
    // Mark performance for global monitoring
    performance.mark(`provider-load-start-${cacheKey}`);
    
    // Check cache first - instant return if already loaded
    if (this.configCache.has(cacheKey)) {
      this.cacheHits++;
      performance.mark(`provider-cache-hit-${cacheKey}`);
      
      const models = this.configCache.get(cacheKey)!;
      this.trackBundleMetrics(cacheKey, startTime);
      return models;
    }

    this.cacheMisses++;
    performance.mark(`provider-cache-miss-${cacheKey}`);

    // Return existing promise if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!;
    }

    // Create loading promise
    const loadingPromise = this.loadReplicateConfig();
    this.loadingPromises.set(cacheKey, loadingPromise);

    try {
      const models = await loadingPromise;
      this.configCache.set(cacheKey, models);
      
      performance.mark(`provider-load-end-${cacheKey}`);
      performance.measure(
        `provider-load-duration-${cacheKey}`,
        `provider-load-start-${cacheKey}`,
        `provider-load-end-${cacheKey}`
      );
      
      this.trackBundleMetrics(cacheKey, startTime);
      return models;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Dynamically load OpenAI models configuration (for future use)
   */
  static async loadOpenAIModels(): Promise<ProviderModel[]> {
    const cacheKey = 'openai';
    const startTime = performance.now();
    
    if (this.configCache.has(cacheKey)) {
      this.cacheHits++;
      this.trackBundleMetrics(cacheKey, startTime);
      return this.configCache.get(cacheKey)!;
    }

    this.cacheMisses++;

    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!;
    }

    const loadingPromise = this.loadOpenAIConfig();
    this.loadingPromises.set(cacheKey, loadingPromise);

    try {
      const models = await loadingPromise;
      this.configCache.set(cacheKey, models);
      this.trackBundleMetrics(cacheKey, startTime);
      return models;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Load all provider configurations in parallel
   */
  static async loadAllProviders(): Promise<Record<string, ProviderModel[]>> {
    const [replicateModels, openaiModels] = await Promise.all([
      this.loadReplicateModels(),
      this.loadOpenAIModels()
    ]);

    return {
      replicate: replicateModels,
      openai: openaiModels
    };
  }

  /**
   * Pre-load configurations for better UX (non-blocking)
   */
  static preloadConfigurations(): void {
    // Start loading in background without blocking
    setTimeout(() => {
      this.loadAllProviders().catch(() => {
        // Silent fail for preloading
      });
    }, 0);
  }

  /**
   * Track component load time for monitoring
   */
  static trackComponentLoad(componentName: string, loadTime: number): void {
    this.componentLoadTimes.set(componentName, loadTime);
    
    // Track with bundle monitoring service
    try {
      const bundleMetrics = this.getBundlePerformanceMetrics();
      this.bundleMonitoring.trackBundleMetrics(
        componentName,
        bundleMetrics.loadMetrics,
        bundleMetrics.cacheMetrics,
        bundleMetrics.efficiencyMetrics
      );
    } catch {
      // Silent fail if monitoring not available
    }
  }

  /**
   * Clear cache for testing or memory management
   */
  static clearCache(): void {
    this.configCache.clear();
    this.loadingPromises.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Get cache statistics for monitoring
   */
  static getCacheStats() {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRatio = totalRequests > 0 ? this.cacheHits / totalRequests : 0;
    
    return {
      cachedProviders: Array.from(this.configCache.keys()),
      cacheSize: this.configCache.size,
      activeLoads: this.loadingPromises.size,
      hitRatio,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      totalRequests
    };
  }

  /**
   * Get comprehensive bundle performance metrics for global monitoring
   */
  static getBundlePerformanceMetrics() {
    const stats = this.getCacheStats();
    
    return {
      moduleId: 'image-generator',
      loadMetrics: {
        initialLoadTime: this.calculateAverageLoadTime(),
        componentLoadTimes: {},
        providerLoadTimes: this.getProviderLoadTimes(),
        totalBundleSize: this.estimateTotalBundleSize(),
        criticalPathSize: this.estimateCriticalPathSize()
      },
      cacheMetrics: {
        hitRatio: stats.hitRatio,
        missCount: stats.cacheMisses,
        hitCount: stats.cacheHits,
        cacheSize: stats.cacheSize,
        memoryUsage: this.estimateMemoryUsage()
      },
      efficiencyMetrics: {
        lazyLoadingEnabled: true,
        dynamicImportsCount: this.configCache.size,
        codeSpittingRatio: 0.7, // Estimated based on our optimizations
        parallelLoadingEnabled: true
      }
    };
  }

  // Private loading methods using dynamic imports
  private static async loadReplicateConfig(): Promise<ProviderModel[]> {
    const { REPLICATE_MODELS } = await import('./configs/replicate-models.config');
    return REPLICATE_MODELS;
  }

  private static async loadOpenAIConfig(): Promise<ProviderModel[]> {
    const { OPENAI_MODELS } = await import('./configs/openai-models.config');
    return OPENAI_MODELS;
  }

  private static trackBundleMetrics(cacheKey: string, startTime: number): void {
    const loadTime = performance.now() - startTime;
    const metrics = this.getBundlePerformanceMetrics();
    
    // Track with global monitoring system
    this.bundleMonitoring.trackBundleMetrics(
      'image-generator',
      {
        ...metrics.loadMetrics,
        initialLoadTime: loadTime
      },
      metrics.cacheMetrics,
      metrics.efficiencyMetrics
    );
  }

  private static calculateAverageLoadTime(): number {
    // Calculate based on recent load times
    const recentLoadTimes: number[] = [];
    this.loadStartTimes.forEach((startTime) => {
      recentLoadTimes.push(performance.now() - startTime);
    });
    
    if (recentLoadTimes.length === 0) return 0;
    return recentLoadTimes.reduce((sum, time) => sum + time, 0) / recentLoadTimes.length;
  }

  private static getProviderLoadTimes(): Record<string, number> {
    const loadTimes: Record<string, number> = {};
    this.loadStartTimes.forEach((startTime, providerKey) => {
      loadTimes[providerKey] = performance.now() - startTime;
    });
    return loadTimes;
  }

  private static estimateTotalBundleSize(): number {
    // Estimate based on number of cached configurations
    return this.configCache.size * 50000; // ~50KB per provider config
  }

  private static estimateCriticalPathSize(): number {
    // Critical path is much smaller due to lazy loading
    return 15000; // ~15KB critical path
  }

  private static estimateMemoryUsage(): number {
    // Estimate memory usage of cached configurations
    return this.configCache.size * 25000; // ~25KB per cached config in memory
  }
} 