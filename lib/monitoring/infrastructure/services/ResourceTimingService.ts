import { ResourceTiming } from '../../domain/entities/DetailedPerformanceMetrics';

export class ResourceTimingService {
  static getResourceTiming(): ResourceTiming[] {
    if (typeof window === 'undefined') return [];

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    const resourceTimings: ResourceTiming[] = [];

    // Add navigation timing
    if (navigation) {
      resourceTimings.push({
        name: 'Document',
        type: 'navigation',
        size: this.estimateSize(navigation),
        duration: navigation.loadEventEnd - navigation.fetchStart,
        startTime: navigation.fetchStart,
        dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcpConnect: navigation.connectEnd - navigation.connectStart,
        sslHandshake: navigation.secureConnectionStart > 0 
          ? navigation.connectEnd - navigation.secureConnectionStart 
          : 0,
        ttfb: navigation.responseStart - navigation.fetchStart,
        download: navigation.responseEnd - navigation.responseStart
      });
    }

    // Add resource timings
    resources.forEach(resource => {
      const resourceType = this.categorizeResource(resource.name);
      
      resourceTimings.push({
        name: this.extractResourceName(resource.name),
        type: resourceType,
        size: this.estimateSize(resource),
        duration: resource.duration,
        startTime: resource.startTime,
        dnsLookup: resource.domainLookupEnd - resource.domainLookupStart,
        tcpConnect: resource.connectEnd - resource.connectStart,
        sslHandshake: resource.secureConnectionStart > 0 
          ? resource.connectEnd - resource.secureConnectionStart 
          : 0,
        ttfb: resource.responseStart - resource.requestStart,
        download: resource.responseEnd - resource.responseStart
      });
    });

    return resourceTimings.sort((a, b) => b.duration - a.duration);
  }

  static getResourceInsights(): ResourceInsight[] {
    const insights: ResourceInsight[] = [];
    const resources = this.getResourceTiming();

    // Analyze slow resources
    resources.forEach(resource => {
      if (resource.duration > 1000) { // > 1 second
        insights.push({
          type: 'slow-resource',
          resource: resource.name,
          severity: resource.duration > 3000 ? 'high' : 'medium',
          value: resource.duration,
          recommendation: `Optimize ${resource.name} loading time`
        });
      }

      if (resource.size > 1000000) { // > 1MB
        insights.push({
          type: 'large-resource',
          resource: resource.name,
          severity: resource.size > 5000000 ? 'high' : 'medium',
          value: resource.size,
          recommendation: `Reduce ${resource.name} size or implement lazy loading`
        });
      }

      if (resource.ttfb > 500) {
        insights.push({
          type: 'slow-ttfb',
          resource: resource.name,
          severity: resource.ttfb > 1000 ? 'high' : 'medium',
          value: resource.ttfb,
          recommendation: `Optimize server response time for ${resource.name}`
        });
      }
    });

    // Analyze resource loading patterns
    const scriptResources = resources.filter(r => r.type === 'script');
    const cssResources = resources.filter(r => r.type === 'stylesheet');
    const imageResources = resources.filter(r => r.type === 'image');

    if (scriptResources.length > 20) {
      insights.push({
        type: 'too-many-scripts',
        resource: 'Multiple Scripts',
        severity: 'medium',
        value: scriptResources.length,
        recommendation: 'Bundle scripts to reduce HTTP requests'
      });
    }

    if (imageResources.length > 50) {
      insights.push({
        type: 'too-many-images',
        resource: 'Multiple Images',
        severity: 'medium',
        value: imageResources.length,
        recommendation: 'Implement image lazy loading'
      });
    }

    return insights;
  }

  static getNetworkWaterfall(): WaterfallEntry[] {
    const resources = this.getResourceTiming();
    
    return resources.map(resource => ({
      name: resource.name,
      type: resource.type,
      startTime: resource.startTime,
      duration: resource.duration,
      phases: {
        dns: resource.dnsLookup,
        connect: resource.tcpConnect,
        ssl: resource.sslHandshake,
        request: resource.ttfb - resource.dnsLookup - resource.tcpConnect - resource.sslHandshake,
        response: resource.download
      }
    })).sort((a, b) => a.startTime - b.startTime);
  }

  private static categorizeResource(url: string): ResourceTiming['type'] {
    if (url.includes('.js') || url.includes('javascript')) return 'script';
    if (url.includes('.css') || url.includes('stylesheet')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) return 'image';
    if (url.includes('/api/') || url.includes('fetch')) return 'fetch';
    return 'script'; // Default for unknown types
  }

  private static extractResourceName(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Extract filename or meaningful path segment
      const segments = pathname.split('/').filter(Boolean);
      return segments[segments.length - 1] || pathname;
    } catch {
      return url.substring(0, 50) + (url.length > 50 ? '...' : '');
    }
  }

  private static estimateSize(resource: PerformanceResourceTiming | PerformanceNavigationTiming): number {
    // Try to get actual transfer size if available
    if ('transferSize' in resource && resource.transferSize > 0) {
      return resource.transferSize;
    }

    // Estimate size based on timing
    const transferTime = resource.responseEnd - resource.responseStart;
    if (transferTime > 0) {
      // Rough estimate: assume average bandwidth of 1MB/s
      return Math.round(transferTime * 1000);
    }

    return 0;
  }
}

interface ResourceInsight {
  type: 'slow-resource' | 'large-resource' | 'slow-ttfb' | 'too-many-scripts' | 'too-many-images';
  resource: string;
  severity: 'low' | 'medium' | 'high';
  value: number;
  recommendation: string;
}

interface WaterfallEntry {
  name: string;
  type: ResourceTiming['type'];
  startTime: number;
  duration: number;
  phases: {
    dns: number;
    connect: number;
    ssl: number;
    request: number;
    response: number;
  };
} 