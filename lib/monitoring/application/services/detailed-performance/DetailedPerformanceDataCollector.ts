import { BundleAnalysisService } from '../../../infrastructure/services/BundleAnalysisService';
import { ComponentProfilerService } from '../../../infrastructure/services/ComponentProfilerService';
import { ResourceTimingService } from '../../../infrastructure/services/ResourceTimingService';
import { BundleAnalysis, ComponentPerformance, ResourceTiming } from '../../../domain/entities/DetailedPerformanceMetrics';

export interface PerformanceData {
  bundleAnalysis: BundleAnalysis;
  componentPerformance: ComponentPerformance[];
  resourceTiming: ResourceTiming[];
}

/**
 * Service responsible for collecting detailed performance data from various sources
 * 
 * Coordinates data collection from bundle analysis, component profiling, and resource timing
 * to provide a comprehensive performance snapshot for analysis.
 */
export class DetailedPerformanceDataCollector {
  /**
   * Collects all detailed performance data from infrastructure services
   * 
   * Orchestrates parallel data collection from multiple performance monitoring
   * sources to minimize collection overhead.
   * 
   * @returns {Promise<PerformanceData>} Collected performance data from all sources
   */
  static async collectPerformanceData(): Promise<PerformanceData> {
    const [bundleAnalysis, componentPerformance, resourceTiming] = await Promise.all([
      BundleAnalysisService.getBundleAnalysis(),
      Promise.resolve(ComponentProfilerService.getComponentPerformance()),
      Promise.resolve(ResourceTimingService.getResourceTiming())
    ]);

    return {
      bundleAnalysis,
      componentPerformance,
      resourceTiming
    };
  }
} 