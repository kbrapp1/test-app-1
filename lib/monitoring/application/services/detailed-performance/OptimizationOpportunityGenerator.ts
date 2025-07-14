import { OptimizationOpportunity, BundleAnalysis, ComponentPerformance, ResourceTiming } from '../../../domain/entities/DetailedPerformanceMetrics';

/**
 * Service responsible for generating optimization opportunities from performance data
 * 
 * Analyzes bundle analysis, component performance, and resource timing data
 * to identify specific optimization opportunities with potential savings estimates.
 */
export class OptimizationOpportunityGenerator {
  /**
   * Generates optimization opportunities based on performance analysis
   * 
   * Examines bundle analysis, component performance, and resource timing
   * to identify specific areas for optimization with effort estimates.
   * 
   * @param {BundleAnalysis} bundleAnalysis - Bundle analysis results
   * @param {ComponentPerformance[]} componentPerformance - Component performance data
   * @param {ResourceTiming[]} resourceTiming - Resource timing data
   * @returns {OptimizationOpportunity[]} Array of optimization opportunities
   */
  static generateOpportunities(
    bundleAnalysis: BundleAnalysis,
    componentPerformance: ComponentPerformance[],
    resourceTiming: ResourceTiming[]
  ): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];

    // Bundle optimization opportunities
    const bundleOpportunities = this.analyzeBundleOptimizations(bundleAnalysis);
    opportunities.push(...bundleOpportunities);

    // Component optimization opportunities
    const componentOpportunities = this.analyzeComponentOptimizations(componentPerformance);
    opportunities.push(...componentOpportunities);

    // Resource optimization opportunities
    const resourceOpportunities = this.analyzeResourceOptimizations(resourceTiming);
    opportunities.push(...resourceOpportunities);

    return opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }

  /**
   * Analyzes bundle data for lazy loading and code splitting opportunities
   * 
   * @param {BundleAnalysis} bundleAnalysis - Bundle analysis results
   * @returns {OptimizationOpportunity[]} Bundle optimization opportunities
   */
  private static analyzeBundleOptimizations(bundleAnalysis: BundleAnalysis): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];

    if (bundleAnalysis.largestImports) {
      bundleAnalysis.largestImports.forEach((imp) => {
        if (imp.isLazyLoadable && imp.size > 100000) {
          opportunities.push({
            type: 'lazy-loading',
            target: imp.component,
            currentSize: imp.size,
            potentialSavings: Math.round(imp.size * 0.8),
            effort: 'medium',
            implementation: `Convert ${imp.component} to lazy loading with React.lazy()`
          });
        }
      });
    }

    return opportunities;
  }

  /**
   * Analyzes component performance for optimization opportunities
   * 
   * @param {ComponentPerformance[]} componentPerformance - Component performance data
   * @returns {OptimizationOpportunity[]} Component optimization opportunities
   */
  private static analyzeComponentOptimizations(componentPerformance: ComponentPerformance[]): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];

    const slowComponents = componentPerformance
      .filter(c => c.mountTime > 100 || c.renderTime > 50 || c.reRenderCount > 10);

    slowComponents.forEach(component => {
      if (component.reRenderCount > 10) {
        opportunities.push({
          type: 'bundle-optimization',
          target: component.name,
          currentSize: component.renderTime * component.reRenderCount,
          potentialSavings: Math.round(component.renderTime * component.reRenderCount * 0.6),
          effort: 'low',
          implementation: `Add React.memo() or useMemo() to ${component.name}`
        });
      }
    });

    return opportunities;
  }

  /**
   * Analyzes resource timing for optimization opportunities
   * 
   * @param {ResourceTiming[]} resourceTiming - Resource timing data
   * @returns {OptimizationOpportunity[]} Resource optimization opportunities
   */
  private static analyzeResourceOptimizations(resourceTiming: ResourceTiming[]): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];

    const slowResources = resourceTiming.filter(r => r.duration > 1000);

    slowResources.forEach(resource => {
      if (resource.download > 500) {
        opportunities.push({
          type: 'image-optimization',
          target: resource.name,
          currentSize: resource.duration,
          potentialSavings: Math.round(resource.duration * 0.4),
          effort: 'high',
          implementation: `Optimize ${resource.name} with compression or CDN`
        });
      }
    });

    return opportunities;
  }
} 